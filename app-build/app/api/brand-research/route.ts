import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { retrieveBrandManufacturingResearch, startBrandManufacturingResearch } from "@/lib/brand-research-report";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { completeManufacturerResearch,connectManufacturerResearch,failManufacturerResearch,reserveManufacturerResearch,updateManufacturerResearchStatus } from "@/lib/manufacturer-evidence";

export const maxDuration = 120;
const Input = z.object({ brand: z.string().trim().min(1).max(120) });
const ResponseId = z.string().trim().min(8).max(200).regex(/^resp_[A-Za-z0-9_-]+$/);
const RunId = z.string().uuid();

async function authorized(request: Request) {
  if (authorizeWrite(request)) return true;
  if (!supabaseConfigured()) return false;
  const { data: { user } } = await (await createClient()).auth.getUser();
  return Boolean(user);
}

export async function POST(request: Request) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Founder authorization is required before paid brand research" }, { status: 401 });
  try {
    const { brand } = Input.parse(await request.json());
    const run=await reserveManufacturerResearch(brand);
    try{
      const job = await startBrandManufacturingResearch(brand);
      await connectManufacturerResearch(run.run_id,job.id,job.status);
      if(job.status==="completed"&&job.report)await completeManufacturerResearch(run.run_id,job.report);
      return NextResponse.json({ data: {...job,runId:run.run_id} }, { status: job.status === "completed" ? 200 : 202 });
    }catch(error){await failManufacturerResearch(run.run_id,error);throw error;}
  } catch (error) {
    const message = error instanceof Error && (error.name === "TimeoutError" || /aborted due to timeout/i.test(error.message))
      ? "The source search took too long. Try the brand again; no draft was published."
      : error instanceof Error ? error.message : "Brand research failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(request: Request) {
  if (!await authorized(request)) return NextResponse.json({ error: "Sign in before checking brand research" }, { status: 401 });
  try {
    const url=new URL(request.url),responseId = ResponseId.parse(url.searchParams.get("id")),runId=RunId.parse(url.searchParams.get("runId"));
    const job = await retrieveBrandManufacturingResearch(responseId);
    if(job.status==="completed"&&job.report)await completeManufacturerResearch(runId,job.report);else await updateManufacturerResearchStatus(runId,job.status);
    return NextResponse.json({ data: job }, { status: job.status === "completed" ? 200 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Brand research status failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
