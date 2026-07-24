import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { researchBrandManufacturing } from "@/lib/brand-research-report";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const maxDuration = 120;
const Input = z.object({ brand: z.string().trim().min(1).max(120) });

async function authorized(request: Request) {
  if (authorizeWrite(request)) return true;
  if (!supabaseConfigured()) return false;
  const { data: { user } } = await (await createClient()).auth.getUser();
  return Boolean(user);
}

export async function POST(request: Request) {
  if (!await authorized(request)) return NextResponse.json({ error: "Sign in before running brand research" }, { status: 401 });
  try {
    const { brand } = Input.parse(await request.json());
    const report = await researchBrandManufacturing(brand);
    return NextResponse.json({ data: report });
  } catch (error) {
    const message = error instanceof Error && (error.name === "TimeoutError" || /aborted due to timeout/i.test(error.message))
      ? "The source search took too long. Try the brand again; no draft was published."
      : error instanceof Error ? error.message : "Brand research failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
