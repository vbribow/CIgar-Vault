import { AvailabilityResearchSchema, availabilityResearchJsonSchema } from "./availability-research";
import { FOX_CIGAR_VERIFICATION_POLICY } from "./verification-sources";
import type { InventoryItem } from "./types";
import { responseOutputText } from "./cigar-vision";

export async function researchInventoryAvailability(item: InventoryItem) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("Live retailer research is temporarily unavailable");
  const identity = `${item.brand}; ${item.line}; ${item.vitola}; release year ${item.vintage || "unknown"}; packaging ${item.packaging || "unknown"}`;
  const prompt = `Today is ${new Date().toISOString()}. Search current direct online listings for this exact premium cigar: ${identity}. ${FOX_CIGAR_VERIFICATION_POLICY}
Return up to eight direct product or auction-lot pages. Require an exact brand, line/release, and vitola or dimensions match; require compatible release timing when a year is known. Do not substitute a nearby vitola, later release, sampler, collection, or similarly named cigar. Prefer authorized or established premium-cigar retailers for regular production and reputable specialist dealers or auction platforms for rare products. Mark In stock or Auction open only when the page directly proves it. Capture total asking price, package quantity, and normalized per-cigar price only when calculable. Never treat an asking price as a completed sale. Exclude search-result pages, social posts, stale snippets, and unclear matches. Prices and availability are leads that the collector must confirm with the seller.`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL?.trim() || "gpt-5.6-terra",
      reasoning: { effort: "medium" },
      store: false,
      max_output_tokens: 5000,
      tools: [{ type: "web_search" }],
      include: ["web_search_call.action.sources"],
      input: prompt,
      text: { format: { type: "json_schema", name: "inventory_availability", strict: true, schema: availabilityResearchJsonSchema } },
    }),
    signal: AbortSignal.timeout(110_000),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error((payload as { error?: { message?: string } }).error?.message || "Retailer research failed");
  const output = responseOutputText(payload);
  if (!output) throw new Error("Retailer research returned no results");
  return AvailabilityResearchSchema.parse(JSON.parse(output));
}
