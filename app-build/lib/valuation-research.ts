import { z } from "zod";
import type { AvailabilityListing, InventoryItem } from "./types";
import { responseOutputText } from "./cigar-vision";
import { FOX_CIGAR_VERIFICATION_POLICY } from "./verification-sources";
import { assertValuationIntegrity } from "./valuation-integrity";
import { cigarMarketStandard } from "./cigar-market-standard";

export const ValuationResearchSchema = z.object({
  replacementValue: z.number().nonnegative().nullable(), marketValue: z.number().nonnegative().nullable(), source: z.string(), sourceUrl: z.string(),
  marketEvidenceType: z.enum(["Verified completed sale","Retail consensus value","Estimated market range","Observed asking price","Insufficient evidence"]).default("Insufficient evidence"),
  marketRangeLow: z.number().nonnegative().nullable().default(null), marketRangeHigh: z.number().nonnegative().nullable().default(null),
  askingPrice: z.number().nonnegative().nullable().default(null), askingPriceSource: z.string().default(""), askingPriceSourceUrl: z.string().default(""),
  lastSaleValue: z.number().nonnegative().nullable().default(null), lastSaleDate: z.string().nullable().default(null), lastSaleVenue: z.string().nullable().default(null), lastSaleSourceUrl: z.string().nullable().default(null),
  confidence: z.enum(["High", "Medium", "Low"]), evidenceDate: z.string(), notes: z.string(), comparables: z.array(z.object({
    title: z.string(), url: z.string(), unitPrice: z.number().nonnegative().nullable(),
    kind: z.enum(["Retail replacement","Secondary asking price","Verified completed sale","Release / MSRP archive"]).default("Retail replacement"),
    notes: z.string(),
  })),
}).superRefine((value, context) => {
  if (value.replacementValue !== null && !value.comparables.some(item =>
    item.kind === "Retail replacement" &&
    item.unitPrice !== null &&
    Math.abs(item.unitPrice - value.replacementValue!) <= Math.max(0.01, value.replacementValue! * 0.01)
  )) {
    context.addIssue({ code:"custom", message:"Retail replacement requires a normalized per-cigar retail comparable" });
  }
  if (value.marketRangeLow !== null && value.marketRangeHigh !== null && value.marketRangeLow > value.marketRangeHigh) {
    context.addIssue({ code:"custom", message:"Market range low must not exceed market range high" });
  }
  if (value.marketEvidenceType === "Verified completed sale" && !(value.lastSaleValue !== null && value.lastSaleDate && value.lastSaleSourceUrl)) {
    context.addIssue({ code:"custom", message:"Verified completed sale requires value, date, and direct proof" });
  }
  if (value.marketEvidenceType === "Retail consensus value" && !(value.marketValue !== null && value.marketRangeLow !== null && value.marketRangeHigh !== null && value.sourceUrl && value.confidence !== "Low" && value.comparables.filter(item => item.kind === "Retail replacement" && item.unitPrice !== null).length >= 2)) {
    context.addIssue({ code:"custom", message:"Retail consensus value requires two independent exact retail comparables, a linked source, a value and range, and Medium or High confidence" });
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

export function valuationRetailLead(research:ValuationResearch):AvailabilityListing|undefined{
  const comparable=research.comparables.find(item=>item.kind==="Retail replacement"&&item.url&&item.unitPrice!==null);
  if(!comparable)return undefined;
  try{
    const url=new URL(comparable.url);
    if(!["http:","https:"].includes(url.protocol))return undefined;
    const seller=url.hostname.replace(/^www\./,"");
    return{seller,sellerType:"Specialty dealer",title:comparable.title,url:url.toString(),availability:"Unknown",askingPrice:comparable.unitPrice??undefined,unitPrice:comparable.unitPrice??undefined,notes:"Exact-cigar retail evidence from valuation research. Confirm current price, stock, shipping, and release details with the seller."};
  }catch{return undefined}
}
export const valuationResearchJsonSchema = { type:"object", additionalProperties:false, properties:{
  replacementValue:{type:["number","null"],minimum:0},marketValue:{type:["number","null"],minimum:0},
  marketEvidenceType:{type:"string",enum:["Verified completed sale","Retail consensus value","Estimated market range","Observed asking price","Insufficient evidence"]},
  marketRangeLow:{type:["number","null"],minimum:0},marketRangeHigh:{type:["number","null"],minimum:0},
  askingPrice:{type:["number","null"],minimum:0},askingPriceSource:{type:"string"},askingPriceSourceUrl:{type:"string"},
  lastSaleValue:{type:["number","null"],minimum:0},lastSaleDate:{type:["string","null"]},lastSaleVenue:{type:["string","null"]},lastSaleSourceUrl:{type:["string","null"]},
  source:{type:"string"},sourceUrl:{type:"string"},confidence:{type:"string",enum:["High","Medium","Low"]},evidenceDate:{type:"string"},notes:{type:"string"},
  comparables:{type:"array",maxItems:5,items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},url:{type:"string"},unitPrice:{type:["number","null"],minimum:0},kind:{type:"string",enum:["Retail replacement","Secondary asking price","Verified completed sale","Release / MSRP archive"]},notes:{type:"string"}},required:["title","url","unitPrice","kind","notes"]}},
},required:["replacementValue","marketValue","marketEvidenceType","marketRangeLow","marketRangeHigh","askingPrice","askingPriceSource","askingPriceSourceUrl","lastSaleValue","lastSaleDate","lastSaleVenue","lastSaleSourceUrl","source","sourceUrl","confidence","evidenceDate","notes","comparables"]} as const;

export function parseValuationResearch(text:string){
  try{return ValuationResearchSchema.parse(JSON.parse(text))}
  catch(error){
    if(error instanceof SyntaxError){
      throw new Error("Valuation research response was incomplete. Please retry this cigar.");
    }
    throw error;
  }
}

export async function researchInventoryValuation(item:InventoryItem){
  const apiKey=process.env.OPENAI_API_KEY?.trim();if(!apiKey)throw new Error("Valuation research is not configured");
  const marketStandard=cigarMarketStandard(item);
  const prompt=`Research exact current pricing for: ${item.brand}; ${item.line}; ${item.vitola}; release/vintage ${item.vintage??"unknown"}; packaging ${item.packaging??"unknown"}.

${FOX_CIGAR_VERIFICATION_POLICY}

Applicable market standard: ${marketStandard}.

Return USD per individual cigar. The current owned quantity is inventory balance only (${item.currentQty??"unknown"}). Never treat it as an original box count or infer manufacturer packaging from it. Use no more than three direct comparable pages and normalize a box price only when its original cigar count is documented.
Never divide, average, normalize, or allocate the price of a mixed collection, sampler, presentation, assortment, or set across unlike component cigars. A box price may be normalized only when every cigar in that box is the same exact cigar. Collection components require exact individual-cigar evidence.

Keep these evidence levels separate:
- replacementValue: current exact-cigar manufacturer or established-retailer price.
- Retail consensus value: New World cigars only; at least two independent, current, exact-identity established-retailer listings. Use their cautious midpoint as marketValue and their defensible spread as the range. This is retail consensus, never a completed sale.
- askingPrice: one observed secondary listing; never a sale or marketValue.
- lastSaleValue: exact completed sale with date, venue, and direct proof.
- Estimated market range: at least two independent exact-identity secondary signals; marketValue is a cautious midpoint.
- Insufficient evidence: no defensible secondary value.

Match brand, line, vitola, release, packaging, and condition. Never substitute another vitola/year, MSRP, ordinary retail, or a closeout for secondary-market evidence. For New World cigars, use two or more traceable exact specialty-retailer listings for Retail consensus value; one retail listing supports replacementValue only. For Habanos, never use Retail consensus value: prioritize completed-result archives from established European auction houses. Confirm whether buyer's premium is included. Classify every comparable. An asking price is not proof—never treat it as a sale. One secondary listing remains an asking price. An estimated range requires at least two independent exact-identity secondary-market signals. For a humidor collection, research cigars individually; calculate residual humidor value separately. If evidence is opaque, say so.

For every retailer comparable, use the direct product page—not a search page or retailer homepage—and make its title include the retailer plus the exact brand, line, vitola, and release when known. This allows the collector to verify availability and purchase the exact cigar without weakening identity matching.

Use the strongest used source in source/sourceUrl. evidenceDate is today (YYYY-MM-DD). Notes under 350 characters; comparable notes under 120. This is evidence, not an appraisal.`;
  let lastError:unknown;
  for(let attempt=0;attempt<2;attempt++){
    try{
      const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_VALUATION_MODEL?.trim()||"gpt-5-mini",reasoning:{effort:"low"},store:false,max_output_tokens:3200,tools:[{type:"web_search"}],include:["web_search_call.action.sources"],input:attempt===0?prompt:`${prompt}\n\nRetry: return one complete JSON object only. Keep the comparables concise so the response is not truncated.`,text:{format:{type:"json_schema",name:"valuation_research",strict:true,schema:valuationResearchJsonSchema}}}),signal:AbortSignal.timeout(90_000)});
      const payload=await response.json();if(!response.ok)throw new Error((payload as {error?:{message?:string}}).error?.message||`OpenAI request failed (${response.status})`);
      const text=responseOutputText(payload);if(!text)throw new Error("Valuation research response was incomplete. Please retry this cigar.");
      const research=parseValuationResearch(text);
      assertValuationIntegrity(item,research);
      return research;
    }catch(error){
      lastError=error;
      if(!(error instanceof Error)||!/response was incomplete/i.test(error.message)||attempt===1)throw error;
    }
  }
  throw lastError instanceof Error?lastError:new Error("Valuation research failed");
}
