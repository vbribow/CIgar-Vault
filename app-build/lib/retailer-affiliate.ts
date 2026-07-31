import { z } from "zod";
import type { AvailabilityListing } from "./types";

export const affiliateDisclosure =
  "Hojavía may receive compensation if you purchase through this link. Compensation does not change the source, evidence status, price shown, or listing order.";

export const RetailerAffiliateProgramSchema = z.object({
  programName: z.string().trim().min(2).max(120),
  retailerName: z.string().trim().min(2).max(120),
  domains: z.array(z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/)).min(1).max(20),
  status: z.enum(["draft", "review", "approved", "active", "paused", "ended"]),
  queryParameter: z.string().trim().regex(/^[A-Za-z0-9_.-]+$/),
  queryValue: z.string().trim().min(1).max(300),
  disclosureText: z.string().trim().min(30).max(500),
  agreementReviewedAt: z.string().datetime().nullable(),
  legalReviewedAt: z.string().datetime().nullable(),
  privacyReviewedAt: z.string().datetime().nullable(),
  ageAndJurisdictionReviewedAt: z.string().datetime().nullable(),
  founderApprovedAt: z.string().datetime().nullable(),
  editorialIndependenceConfirmed: z.boolean(),
}).strict();

export type RetailerAffiliateProgram = z.infer<typeof RetailerAffiliateProgramSchema>;

export function affiliateActivationIssues(program: RetailerAffiliateProgram) {
  const issues: string[] = [];
  if (program.status !== "active") issues.push("Program is not active");
  if (!program.agreementReviewedAt) issues.push("Affiliate agreement review is incomplete");
  if (!program.legalReviewedAt) issues.push("Legal disclosure review is incomplete");
  if (!program.privacyReviewedAt) issues.push("Privacy review is incomplete");
  if (!program.ageAndJurisdictionReviewedAt) issues.push("Age and jurisdiction review is incomplete");
  if (!program.founderApprovedAt) issues.push("Founder launch approval is incomplete");
  if (!program.editorialIndependenceConfirmed) issues.push("Editorial independence is not confirmed");
  if (!/compensation|commission/i.test(program.disclosureText)) {
    issues.push("Disclosure does not plainly state the compensation relationship");
  }
  return issues;
}

export function parseRetailerAffiliatePrograms(raw = process.env.RETAILER_AFFILIATE_PROGRAMS_JSON) {
  if (!raw?.trim()) return [] as RetailerAffiliateProgram[];
  try {
    return z.array(RetailerAffiliateProgramSchema).max(50).parse(JSON.parse(raw));
  } catch {
    // Commercial configuration always fails closed: malformed data can never
    // create a compensated or tracked outbound link.
    return [] as RetailerAffiliateProgram[];
  }
}

export function affiliateConfigurationAudit(
  raw = process.env.RETAILER_AFFILIATE_PROGRAMS_JSON,
) {
  if (!raw?.trim() || raw.trim() === "[]") {
    return {
      state: "not configured" as const,
      programs: [] as Array<{
        programName: string;
        retailerName: string;
        domains: string[];
        status: RetailerAffiliateProgram["status"];
        issues: string[];
        ready: boolean;
      }>,
    };
  }
  let programs: RetailerAffiliateProgram[];
  try {
    programs = z.array(RetailerAffiliateProgramSchema).max(50).parse(JSON.parse(raw));
  } catch {
    return { state:"invalid" as const, programs:[] };
  }
  return {
    state: "configured" as const,
    programs: programs.map(program => {
      const issues = affiliateActivationIssues(program);
      return {
        programName: program.programName,
        retailerName: program.retailerName,
        domains: program.domains,
        status: program.status,
        issues,
        ready: issues.length === 0,
      };
    }),
  };
}

function matchingProgram(url: URL, programs: RetailerAffiliateProgram[]) {
  const hostname = url.hostname.toLowerCase();
  return programs.find(program =>
    affiliateActivationIssues(program).length === 0
    && program.domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
  );
}

export function decorateRetailerListing(
  listing: AvailabilityListing,
  programs = parseRetailerAffiliatePrograms(),
): AvailabilityListing {
  let url: URL;
  try {
    url = new URL(listing.url);
  } catch {
    return listing;
  }
  if (url.protocol !== "https:") return listing;
  const program = matchingProgram(url, programs);
  if (!program) return listing;
  url.searchParams.set(program.queryParameter, program.queryValue);
  return {
    ...listing,
    outboundUrl: url.toString(),
    commercialRelationship: "Affiliate — compensated link",
    commercialDisclosure: program.disclosureText || affiliateDisclosure,
  };
}

export function decorateRetailerListings(
  listings: AvailabilityListing[],
  programs = parseRetailerAffiliatePrograms(),
) {
  // Decoration is deliberately a final map. Commercial terms never sort,
  // filter, promote, price, or score a retailer result.
  return listings.map(listing => decorateRetailerListing(listing, programs));
}
