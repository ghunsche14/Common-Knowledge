
import { NextResponse } from "next/server";
import { db, validText, publicTopic } from "@/lib/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!validText(body.title, 200)) {
      return NextResponse.json(
        { error: "Please enter a title (up to 200 characters)." },
        { status: 400 }
      );
    }

    if (!validText(body.prompt, 5000)) {
      return NextResponse.json(
        { error: "Please enter a topic description." },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("topics")
      .insert({
        title: body.title.trim(),
        prompt: body.prompt.trim(),
        identity_mode: body.identity_mode ?? "anonymous",
        results_visibility: body.results_visibility ?? "link"
      })
      .select("*")
      .single();

    if (error) {
      console.error("Create topic error:", error);
      return NextResponse.json(
        { error: "Could not create topic. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ topic: publicTopic(data) }, { status: 201 });
  } catch (error) {
    console.error("Create topic request failed:", error);
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
