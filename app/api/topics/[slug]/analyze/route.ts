
import { NextResponse } from "next/server";
import { db, openai } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const { data: topic, error: topicError } = await db
      .from("topics")
      .select("id, title, prompt")
      .eq("slug", slug)
      .maybeSingle();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: "Topic not found." },
        { status: 404 }
      );
    }

    const { data: responses, error: responsesError } = await db
      .from("responses")
      .select("content, display_name, created_at")
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: true });

    if (responsesError) {
      console.error("Load responses for analysis failed:", responsesError);
      return NextResponse.json(
        { error: "Could not load responses." },
        { status: 500 }
      );
    }

    if (!responses || responses.length === 0) {
      return NextResponse.json(
        { error: "There are no responses to analyze yet." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You analyze group responses to a shared decision question. Be neutral and evidence-based. Do not invent agreement or disagreement. Return valid JSON with these keys:
summary (string),
similarities (array of objects with theme and description),
differences (array of objects with theme and description),
unique_perspectives (array of objects with point and description),
follow_up_questions (array of strings),
caveats (string).
Ground every finding in the submitted responses. If there is little evidence for a category, return an empty array.`
        },
        {
          role: "user",
          content: JSON.stringify({
            topic: topic.title,
            question: topic.prompt,
            responses: responses.map((r, i) => ({
              participant: `Participant ${i + 1}`,
              response: r.content
            }))
          })
        }
      ]
    });

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      throw new Error("The AI returned an empty analysis.");
    }

    const analysis = JSON.parse(text);

    const { error: saveError } = await db
      .from("topics")
      .update({
        analysis,
        response_count: responses.length,
        analyzed_at: new Date().toISOString()
      })
      .eq("id", topic.id);

    if (saveError) {
      console.error("Save analysis failed:", saveError);
      return NextResponse.json(
        { error: "Could not save the AI analysis." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      analysis,
      response_count: responses.length
    });
  } catch (error) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { error: "AI analysis failed. Check the server logs and API configuration." },
      { status: 500 }
    );
  }
}
