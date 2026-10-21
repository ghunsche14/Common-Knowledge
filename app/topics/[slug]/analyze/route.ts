import { NextResponse } from "next/server";
import { db, openai } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const internalSecret = process.env.INTERNAL_ANALYSIS_SECRET;
    const isInternal = !!internalSecret && req.headers.get("x-internal-analysis") === internalSecret;
    // Public refresh is allowed for this link-based MVP; configure a secret to protect
    // automated calls and add rate limiting/authentication before a public production launch.
    const { data: topic, error } = await db.from("topics").select("*").eq("slug", params.slug).maybeSingle();
    if (error || !topic) return NextResponse.json({ error: "Topic not found." }, { status: 404 });
    const { data: responses, error: responseError } = await db.from("responses").select("display_name,content,created_at").eq("topic_id", topic.id).order("created_at", { ascending: true }).limit(150);
    if (responseError) throw responseError;
    if (!responses || responses.length === 0) return NextResponse.json({ analysis: null, message: "No responses yet." });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Add OPENAI_API_KEY to enable semantic AI analysis." }, { status: 503 });

    const participants = responses.map((r: any, i: number) => ({
      participant: topic.identity_mode === "named" ? (r.display_name || `Participant ${i + 1}`) : `Participant ${i + 1}`,
      response: r.content
    }));
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `You are a neutral facilitator synthesizing independent responses to a shared question. Return valid JSON with keys: summary (string), similarities (array of objects with theme, description, evidence array of participant labels), differences (array of objects with theme, description, evidence array), unique_perspectives (array of objects with point, description, evidence array), follow_up_questions (array of strings), caveats (string). Compare meanings, not just matching words. Distinguish agreement, compatible-but-different views, direct contradictions, and topics only mentioned by one person. Do not infer a person's beliefs beyond their text. Do not treat a lack of mention as disagreement. Preserve minority views, note when evidence is weak, and never invent quotes or claims. Use concise, readable language. Evidence must identify only participant labels provided in the input. Avoid exposing names unless the topic is explicitly named. If only one response exists, state that group comparisons are preliminary.` },
        { role: "user", content: JSON.stringify({ topic: topic.title, question: topic.prompt, responses: participants }) }
      ]
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    let analysis: any;
    try { analysis = JSON.parse(raw); } catch { throw new Error("AI returned invalid JSON"); }
    const { error: saveError } = await db.from("topics").update({ analysis, response_count: responses.length, analyzed_at: new Date().toISOString() }).eq("id", topic.id);
    if (saveError) throw saveError;
    return NextResponse.json({ analysis, response_count: responses.length, internal: isInternal });
  } catch (e) {
    console.error("analysis failed", e);
    return NextResponse.json({ error: "AI analysis failed. Check your API key, quota, and database configuration." }, { status: 500 });
  }
}
