import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function validText(value: unknown, max = 5000): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

export function publicTopic(row: any) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    prompt: row.prompt,
    identity_mode: row.identity_mode,
    results_visibility: row.results_visibility,
    created_at: row.created_at,
    response_count: row.response_count ?? 0,
    analysis: row.analysis ?? null
  };
}
