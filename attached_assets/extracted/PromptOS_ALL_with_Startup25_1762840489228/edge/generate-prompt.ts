// Supabase Edge Function: generate-prompt
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
serve(async (req) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  const body = await req.json();
  const { category, inputs } = body ?? {};
  if (!category) return new Response(JSON.stringify({ error: "Missing category" }), { status: 400 });
  const prompt = `Category: ${category}\nInputs: ${JSON.stringify(inputs ?? {})}`;
  return new Response(JSON.stringify({ ok: true, prompt }), { headers: { "content-type": "application/json" } });
});