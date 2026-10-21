
import { NextResponse } from "next/server";
import { db, publicTopic } from "@/lib/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const { data: topic, error: topicError } = await db
      .from("topics")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (topicError) {
      console.error("Get topic failed:", topicError);
      return NextResponse.json(
        { error: "Could not retrieve topic." },
        { status: 500 }
      );
    }

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found." },
        { status: 404 }
      );
    }

    const { data: responses, error: responsesError } = await db
      .from("responses")
      .select("id, display_name, content, created_at")
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: true });

    if (responsesError) {
      console.error("Get responses failed:", responsesError);
      return NextResponse.json(
        { error: "Could not retrieve responses." },
        { status: 500 }
      );
    }

    const savedResponses = responses ?? [];

    return NextResponse.json({
      topic: {
        ...publicTopic(topic),
        response_count: savedResponses.length
      },
      responses: savedResponses
    });
  } catch (error) {
    console.error("Get topic request failed:", error);
    return NextResponse.json(
      { error: "Could not retrieve topic." },
      { status: 500 }
    );
  }
}
