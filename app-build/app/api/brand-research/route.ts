import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { researchBrandManufacturing } from "@/lib/brand-research-report";

export const maxDuration = 120;
const Input = z.object({ brand: z.string().trim().min(1).max(120) });

export async function POST(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization required" }, { status: 401 });
  try {
    const { brand } = Input.parse(await request.json());
    const report = await researchBrandManufacturing(brand);
    return NextResponse.json({ data: report });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Brand research failed" }, { status: 502 });
  }
}
