import { NextResponse } from "next/server";
import { authorizeWrite } from "@/lib/config";
import { CigarVisionResultSchema, cigarVisionJsonSchema, responseOutputText } from "@/lib/cigar-vision";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

const MAX_FILES = 8;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

async function authorized(request: Request) {
  if (authorizeWrite(request)) return true;
  if (!supabaseConfigured()) return false;
  const { data: { user } } = await (await createClient()).auth.getUser();
  return Boolean(user);
}

export async function POST(request: Request) {
  if (!await authorized(request)) return NextResponse.json({ error: "Sign in before analyzing photos" }, { status: 401 });
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "Visual identification is not configured" }, { status: 503 });
  try {
    const form = await request.formData();
    const files = form.getAll("photos").filter((value): value is File => value instanceof File);
    if (!files.length || files.length > MAX_FILES) return NextResponse.json({ error: "Choose between 1 and 8 photos" }, { status: 422 });
    if (files.some((file) => !allowedTypes.has(file.type))) return NextResponse.json({ error: "Use JPG, PNG, or WebP photos" }, { status: 415 });
    if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) return NextResponse.json({ error: "The prepared photos exceed the 4 MB analysis limit" }, { status: 413 });
    const images = await Promise.all(files.map(async (file) => ({ type: "input_image", image_url: `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`, detail: "high" })));
    const prompt = "Identify the cigar inventory represented by these views of one physical asset. Read visible bands, box text, release year, factory/box code, and count only clearly visible cigars. Distinguish a sealed/full box from loose sticks. Never invent missing details: use empty strings or nulls and list ambiguity in uncertainties. Return the manufacturer as brand, the product family as line, and the named cigar or assortment as vitola. This result is only a review draft and must not save inventory.";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_VISION_MODEL?.trim() || "gpt-5.6-terra", reasoning: { effort: "low" }, store: false, max_output_tokens: 1800,
        input: [{ role: "user", content: [{ type: "input_text", text: prompt }, ...images] }],
        text: { format: { type: "json_schema", name: "cigar_identification", strict: true, schema: cigarVisionJsonSchema } },
      }), signal: AbortSignal.timeout(60_000),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error((payload as { error?: { message?: string } }).error?.message || `OpenAI request failed (${response.status})`);
    const text = responseOutputText(payload);
    if (!text) throw new Error("The vision model returned no identification");
    return NextResponse.json({ data: CigarVisionResultSchema.parse(JSON.parse(text)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Photo analysis failed" }, { status: 502 });
  }
}
