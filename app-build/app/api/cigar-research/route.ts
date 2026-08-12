import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { listingMatchesExactIdentity } from "@/lib/retailer-trust";
import { removeCommercialNavigation } from "@/lib/mobile-commerce-policy";
import { FOX_CIGAR_VERIFICATION_POLICY } from "@/lib/verification-sources";
import { CigarResearchSchema } from "@/lib/cigar-research";
import {
  beginCigarResearch,
  CigarResearchServiceError,
  cigarResearchServiceStatus,
  finishCigarResearch,
  readCachedCigarResearch,
  recordCigarResearchCacheHit,
  requestCigarResearch,
  writeCachedCigarResearch,
} from "@/lib/cigar-research-service";
import { AiCreditError, finishAiCreditUsage, reserveAiCredits } from "@/lib/ai-credits";

export const maxDuration = 120;
const Input = z.object({ query: z.string().trim().min(3).max(300), submissionId: z.string().uuid() });
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0, must-revalidate", Pragma: "no-cache" };

export async function GET() {
  return NextResponse.json({ data: cigarResearchServiceStatus() }, { headers: privateHeaders });
}

export async function POST(request: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Sign in before researching a cigar" }, { status: 401, headers: privateHeaders });
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before researching a cigar" }, { status: 401, headers: privateHeaders });
  let submissionId = "";
  let started = false;
  let creditsReserved = false;
  try {
    const input = Input.parse(await request.json());
    submissionId = input.submissionId;
    const service = cigarResearchServiceStatus();
    if (!service.available) throw new CigarResearchServiceError(service.code, service.message, 503);
    const cached = await readCachedCigarResearch(input.query);
    if (cached) {
      await recordCigarResearchCacheHit(user.id, input.submissionId, input.query);
      return NextResponse.json({ data: cached, meta: { cached: true } }, { headers: privateHeaders });
    }
    const model = process.env.OPENAI_RESEARCH_MODEL?.trim() || "gpt-5.6-terra";
    await reserveAiCredits(user.id, input.submissionId, "exact-research");
    creditsReserved = true;
    await beginCigarResearch(user.id, input.submissionId, input.query, model);
    started = true;
    const prompt = `Today is ${new Date().toISOString()}. Research this exact premium cigar or manufacturer presentation: ${JSON.stringify(input.query)}. Resolve common spacing variants such as Opus6 and Opus 6, but do not broaden the identity. First determine whether the query names one cigar, an assortment, a travel humidor, a numbered presentation, or an ambiguous family term. For a presentation, identify the presentation itself and document its exact component cigars when a direct source supports them. Resolve the exact brand, line or release, named vitola, dimensions, compatible release timing, and packaging. Do not substitute a nearby vitola, sampler, collection, later edition, or family-name match. Document dimensions, country, actual factory, blender, wrapper, binder, filler, stated strength, packaging, release year, and edition only when a direct product-level source supports each detail. Use empty strings for facts that remain unknown. Prefer official manufacturer/importer pages, then established cigar trade publications. Clearly state uncertainty and conflicts. Also find up to eight current direct retailer or auction listings for this exact identity. ${FOX_CIGAR_VERIFICATION_POLICY} Mark a listing in stock only when the direct page proves it; distinguish asking prices from completed sales; normalize per-cigar price only when package quantity is known. Exclude search pages, social posts, stale snippets, and nearby products. Every returned source and listing URL must be a direct page actually visited during this research. Return concise collector-friendly language.`;
    const researched = await requestCigarResearch({ query: input.query, userId: user.id, prompt, model });
    const exact = {
      inventoryId: "RESEARCH",
      brand: researched.result.profile.brand,
      line: researched.result.profile.line,
      vitola: researched.result.profile.vitola,
      vintage: researched.result.profile.releaseYear || undefined,
      packaging: researched.result.profile.packaging || undefined,
    };
    const listings = removeCommercialNavigation(
      researched.result.availability.listings.filter(listing => listingMatchesExactIdentity(exact, listing)),
    );
    const result = CigarResearchSchema.parse({
      ...researched.result,
      availability: {
        ...researched.result.availability,
        listings: listings.map(listing => ({
          ...listing,
          askingPrice: listing.askingPrice ?? null,
          quantity: listing.quantity ?? null,
          unitPrice: listing.unitPrice ?? null,
          listingDate: listing.listingDate ?? null,
          condition: listing.condition ?? null,
        })),
      },
    });
    await writeCachedCigarResearch(input.query, result);
    await finishCigarResearch(input.submissionId, { status: "completed", ...researched.usage });
    await finishAiCreditUsage(input.submissionId, { status: "completed", inputTokens: researched.usage.inputTokens, outputTokens: researched.usage.outputTokens });
    return NextResponse.json({ data: result, meta: { cached: false } }, { headers: privateHeaders });
  } catch (error) {
    const serviceError = error instanceof AiCreditError
      ? new CigarResearchServiceError(error.code, error.message, error.status)
      : error instanceof CigarResearchServiceError
      ? error
      : error instanceof z.ZodError
        ? new CigarResearchServiceError("invalid_request", "Enter a valid cigar name and try again.", 422)
        : new CigarResearchServiceError("research_failed", error instanceof Error ? error.message : "Cigar research failed", 502);
    if (started && submissionId) {
      await finishCigarResearch(submissionId, { status: "failed", errorCode: serviceError.code }).catch(() => undefined);
    }
    if (creditsReserved && submissionId) await finishAiCreditUsage(submissionId, { status: "failed" }).catch(() => undefined);
    return NextResponse.json(
      { error: serviceError.message, code: serviceError.code, retryable: serviceError.retryable },
      { status: serviceError.status, headers: privateHeaders },
    );
  }
}
