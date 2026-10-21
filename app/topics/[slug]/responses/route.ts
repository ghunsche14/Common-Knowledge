
import { NextResponse } from "next/server";
import { db, validText } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    if (!validText(body.content, 8000) || body.content.trim().length < 3) {
      return NextResponse.json(
        { error: "Please enter a response (3–8,000 characters)." },
        { status: 400 }
      );
    }

    const { data: topic, error: topicError } = await db
      .from("topics")
      .select("id, identity_mode")
      .eq("slug", slug)
      .maybeSingle();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: "Topic not found." },
        { status: 404 }
      );
    }

    const display_name =
      topic.identity_mode === "named" &&
      validText(body.display_name, 80)
        ? body.display_name.trim()
        : null;

    if (topic.identity_mode === "named" && !display_name) {
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 }
      );
    }

    const { error } = await db.from("responses").insert({
      topic_id: topic.id,
      content: body.content.trim(),
      display_name
    });

    if (error) {
      console.error("Save response failed:", error);
      return NextResponse.json(
        { error: "Could not save response." },
        { status: 500 }
      );
    }

    try {
      const base =
        process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

      await fetch(
        `${base}/api/topics/${slug}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-analysis":
              process.env.INTERNAL_ANALYSIS_SECRET || ""
          },
          cache: "no-store"
        }
      );
    } catch (error) {
      console.error("Automatic analysis failed:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Submit response failed:", error);
    return NextResponse.json(
      { error: "Could not save response." },
      { status: 500 }
    );
  }
}
