import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db, validText, publicTopic } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!validText(body.title, 120) || !validText(body.prompt, 1200))
      return NextResponse.json({ error: "Enter a title and a question (within the character limits)." }, { status: 400 });
    const identity_mode = body.identity_mode === "named" ? "named" : "anonymous";
    const slug = randomBytes(9).toString("base64url");
    const { data, error } = await db.from("topics").insert({
      slug, title: body.title.trim(), prompt: body.prompt.trim(),
      identity_mode, results_visibility: "link"
    }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ topic: publicTopic(data) });
  } catch (e) {
    console.error("create topic failed", e);
    return NextResponse.json({ error: "Could not create topic. Check your database setup." }, { status: 500 });
  }
}
