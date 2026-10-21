
import { NextResponse } from "next/server";
import { db, publicTopic } from "@/lib/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const { data, error } = await db
      .from("topics")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Get topic failed:", error);
      return NextResponse.json(
        { error: "Could not retrieve topic." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Topic not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ topic: publicTopic(data) });
  } catch (error) {
    console.error("Get topic request failed:", error);
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 500 }
    );
  }
}
