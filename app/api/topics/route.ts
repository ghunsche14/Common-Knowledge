
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db, validText, publicTopic } from "@/lib/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!validText(body.title, 120)) {
      return NextResponse.json(
        { error: "Title must be between 1 and 120 characters." },
        { status: 400 }
      );
    }

    if (!validText(body.prompt, 1200)) {
      return NextResponse.json(
        { error: "Description must be between 1 and 1200 characters." },
        { status: 400 }
      );
    }

    const slug = randomBytes(8).toString("hex");

    const { data, error } = await db
      .from("topics")
      .insert({
        slug,
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
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { topic: publicTopic(data) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create topic request failed:", error);
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
