import { NextResponse } from "next/server";
import { db, publicTopic } from "@/lib/server";

export const runtime = "nodejs";
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const { data: topic, error } = await db.from("topics").select("*").eq("slug", params.slug).maybeSingle();
  if (error || !topic) return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  const { data: responses, error: responseError } = await db.from("responses").select("id,display_name,content,created_at").eq("topic_id", topic.id).order("created_at", { ascending: true }).limit(500);
  if (responseError) return NextResponse.json({ error: "Could not load responses." }, { status: 500 });
  return NextResponse.json({ topic: publicTopic({ ...topic, response_count: responses.length }), responses: responses || [] });
}
