import { z } from "zod";
import type { InventoryItem } from "./types";
import { responseOutputText } from "./cigar-vision";

export const ValuationResearchSchema = z.object({
  replacementValue: z.number().nonnegative().nullable(), marketValue: z.number().nonnegative().nullable(), source: z.string(), sourceUrl: z.string(),
  marketEvidenceType: z.enum(["Verified completed sale","Estimated market range","Observed asking price","Insufficient evidence"]).default("Insufficient evidence"),
  marketRangeLow: z.number().nonnegative().nullable().default(null), marketRangeHigh: z.number().nonnegative().nullable().default(null),
  askingPrice: z.number().nonnegative().nullable().default(null), askingPriceSource: z.string().default(""), askingPriceSourceUrl: z.string().default(""),
  lastSaleValue: z.number().nonnegative().nullable().default(null), lastSaleDate: z.string().nullable().default(null), lastSaleVenue: z.string().nullable().default(null), lastSaleSourceUrl: z.string().nullable().default(null),
  confidence: z.enum(["High", "Medium", "Low"]), evidenceDate: z.string(), notes: z.string(), comparables: z.array(z.object({
    title: z.string(), url: z.string(), unitPrice: z.number().nonnegative().nullable(),
    kind: z.enum(["Retail replacement","Secondary asking price","Verified completed sale","Release / MSRP archive"]).default("Retail replacement"),
    notes: z.string(),
  })),
}).superRefine((value, context) => {
  if (value.marketRangeLow !== null && value.marketRangeHigh !== null && value.marketRangeLow > value.marketRangeHigh) {
    context.addIssue({ code:"custom", message:"Market range low must not exceed market range high" });
  }
  if (value.marketEvidenceType === "Verified completed sale" && !(value.lastSaleValue !== null && value.lastSaleDate && value.lastSaleSourceUrl)) {
    context.addIssue({ code:"custom", message:"Verified completed sale requires value, date, and direct proof" });
  }
  if (value.marketEvidenceType === "Estimated market range" && !(value.marketValue !== null && value.marketRangeLow !== null && value.marketRangeHigh !== null && value.comparables.filter(item => item.kind === "Secondary asking price" || item.kind === "Verified completed sale").length >= 2)) {
    context.addIssue({ code:"custom", message:"Estimated market range requires two independent secondary-market comparables" });
  }
  if (value.marketEvidenceType === "Observed asking price" && !(value.askingPrice !== null && value.askingPriceSourceUrl && value.marketValue === null)) {
    context.addIssue({ code:"custom", message:"Observed asking price must remain separate from market value" });
  }
  if (value.marketEvidenceType === "Insufficient evidence" && value.marketValue !== null) {
    context.addIssue({ code:"custom", message:"Insufficient evidence cannot carry a market value" });
  }
});
export type ValuationResearch = z.infer<typeof ValuationResearchSchema>;
export const valuationResearchJsonSchema = { type:"object", additionalProperties:false, properties:{
  replacementValue:{type:["number","null"],minimum:0},marketValue:{type:["number","null"],minimum:0},
  marketEvidenceType:{type:"string",enum:["Verified completed sale","Estimated market range","Observed asking price","Insufficient evidence"]},
  marketRangeLow:{type:["number","null"],minimum:0},marketRangeHigh:{type:["number","null"],minimum:0},
  askingPrice:{type:["number","null"],minimum:0},askingPriceSource:{type:"string"},askingPriceSourceUrl:{type:"string"},
  lastSaleValue:{type:["number","null"],minimum:0},lastSaleDate:{type:["string","null"]},lastSaleVenue:{type:["string","null"]},lastSaleSourceUrl:{type:["string","null"]},
  source:{type:"string"},sourceUrl:{type:"string"},confidence:{type:"string",enum:["High","Medium","Low"]},evidenceDate:{type:"string"},notes:{type:"string"},
  comparables:{type:"array",maxItems:5,items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},url:{type:"string"},unitPrice:{type:["number","null"],minimum:0},kind:{type:"string",enum:["Retail replacement","Secondary asking price","Verified completed sale","Release / MSRP archive"]},notes:{type:"string"}},required:["title","url","unitPrice","kind","notes"]}},
},required:["replacementValue","marketValue","marketEvidenceType","marketRangeLow","marketRangeHigh","askingPrice","askingPriceSource","askingPriceSourceUrl","lastSaleValue","lastSaleDate","lastSaleVenue","lastSaleSourceUrl","source","sourceUrl","confidence","evidenceDate","notes","comparables"]} as const;

export function parseValuationResearch(text:string){
  try{return ValuationResearchSchema.parse(JSON.parse(text))}
  catch(error){
    if(error instanceof SyntaxError&&/unterminated|unexpected end/i.test(error.message)){
      throw new Error("Valuation research response was incomplete. Please retry this cigar.");
    }
    throw error;
  }
}

export async function researchInventoryValuation(item:InventoryItem){
  const apiKey=process.env.OPENAI_API_KEY?.trim();if(!apiKey)throw new Error("Valuation research is not configured");
  const prompt=`Research current pricing evidence for this cigar inventory lot: ${item.brand}; line ${item.line}; vitola ${item.vitola}; vintage/release ${item.vintage??"unknown"}; packaging ${item.packaging??"unknown"}; collector currently owns ${item.currentQty??"an unknown number of"} cigars. The collector's current owned quantity is inventory balance only. Never treat it as an original box count, presentation size, packaging fact, or manufacturer configuration. Find up to five direct comparable pages. Return USD values per individual cigar, never box totals. Normalize box prices only by the documented source's original cigar count.

Cedriva has five distinct value concepts and they must never be blended:
1. replacementValue: current verified retail replacement price from a manufacturer or established retailer.
2. askingPrice: an observed secondary-market asking price. Record its seller and direct URL, but never treat it as a sale or market value.
3. lastSaleValue: a verified completed secondary-market transaction with exact identity, sold status, date, venue, and direct proof.
4. marketRangeLow / marketRangeHigh and marketValue: an estimated secondary-market range and midpoint supported by at least two independent exact-identity secondary-market signals. Retail/MSRP evidence does not count as a secondary-market signal.
5. Insufficient evidence: the required result when no defensible secondary value exists.

Set marketEvidenceType using this strict hierarchy. Use "Verified completed sale" when an exact completed sale is proven; marketValue may equal lastSaleValue only when that sale is current and representative, otherwise leave marketValue null. Use "Estimated market range" only when at least two independent exact-identity secondary asking or completed-sale comparables support a range; set marketValue to its cautious midpoint and confidence no higher than Medium unless multiple verified completed sales support it. Use "Observed asking price" when only one exact secondary listing is found; marketValue and both range fields must be null. Use "Insufficient evidence" when no exact secondary evidence exists; marketValue, range, and asking price must be null. Never use MSRP, ordinary retail, a retailer closeout, a different vitola, a different release year, or another cigar in the same line to manufacture aftermarket precision.

Classify every comparable as Retail replacement, Secondary asking price, Verified completed sale, or Release / MSRP archive. Match exact brand, line, vitola, release/vintage, packaging quantity, and condition. For New World cigars, search established specialty auctions, public sold-result archives, and traceable specialty-dealer listings, but preserve "Insufficient evidence" when the market is opaque. For Habanos, Cuban, vintage, discontinued, or collector presentations, prioritize completed-result archives from established European auction houses. Confirm whether buyer's premium is included. When the product is a collection sold with a humidor, research included cigars individually; Cedriva calculates residual humidor value separately.

source/sourceUrl identify the strongest evidence actually used. evidenceDate must be today's date in YYYY-MM-DD. Keep notes under 500 characters and comparable notes under 180 characters. This is research evidence, not an appraisal.`;
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_VALUATION_MODEL?.trim()||"gpt-5-mini",reasoning:{effort:"low"},store:false,max_output_tokens:3600,tools:[{type:"web_search"}],include:["web_search_call.action.sources"],input:prompt,text:{format:{type:"json_schema",name:"valuation_research",strict:true,schema:valuationResearchJsonSchema}}}),signal:AbortSignal.timeout(90_000)});
  const payload=await response.json();if(!response.ok)throw new Error((payload as {error?:{message?:string}}).error?.message||`OpenAI request failed (${response.status})`);const text=responseOutputText(payload);if(!text)throw new Error("Research returned no valuation draft");return parseValuationResearch(text);
}
