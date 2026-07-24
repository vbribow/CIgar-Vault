import { z } from "zod";
import type { InventoryItem } from "./types";
import { responseOutputText } from "./cigar-vision";

export const ValuationResearchSchema = z.object({
  replacementValue: z.number().nonnegative().nullable(), marketValue: z.number().nonnegative().nullable(), source: z.string(), sourceUrl: z.string(),
  lastSaleValue: z.number().nonnegative().nullable().default(null), lastSaleDate: z.string().nullable().default(null), lastSaleVenue: z.string().nullable().default(null), lastSaleSourceUrl: z.string().nullable().default(null),
  confidence: z.enum(["High", "Medium", "Low"]), evidenceDate: z.string(), notes: z.string(), comparables: z.array(z.object({ title: z.string(), url: z.string(), unitPrice: z.number().nonnegative().nullable(), notes: z.string() })),
});
export type ValuationResearch = z.infer<typeof ValuationResearchSchema>;
export const valuationResearchJsonSchema = { type:"object", additionalProperties:false, properties:{ replacementValue:{type:["number","null"],minimum:0},marketValue:{type:["number","null"],minimum:0},lastSaleValue:{type:["number","null"],minimum:0},lastSaleDate:{type:["string","null"]},lastSaleVenue:{type:["string","null"]},lastSaleSourceUrl:{type:["string","null"]},source:{type:"string"},sourceUrl:{type:"string"},confidence:{type:"string",enum:["High","Medium","Low"]},evidenceDate:{type:"string"},notes:{type:"string"},comparables:{type:"array",items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},url:{type:"string"},unitPrice:{type:["number","null"],minimum:0},notes:{type:"string"}},required:["title","url","unitPrice","notes"]}}},required:["replacementValue","marketValue","lastSaleValue","lastSaleDate","lastSaleVenue","lastSaleSourceUrl","source","sourceUrl","confidence","evidenceDate","notes","comparables"]} as const;

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
  const prompt=`Research current pricing evidence for this cigar inventory lot: ${item.brand}; line ${item.line}; vitola ${item.vitola}; vintage/release ${item.vintage??"unknown"}; packaging ${item.packaging??"unknown"}; collector currently owns ${item.currentQty??"an unknown number of"} cigars. The collector's current owned quantity is inventory balance only. Never treat it as an original box count, presentation size, packaging fact, or manufacturer configuration. Find up to three direct, current comparable pages. Return USD values per individual cigar, never box totals. Normalize box prices by the documented source's original cigar count. When the product is a collection sold with a humidor, do not assign the complete-set price to a cigar: research the included cigars individually. Cedriva calculates the residual humidor value separately as documented complete-set retail minus the documented retail of every originally included cigar. replacementValue is current retail replacement price from a manufacturer or established retailer. marketValue is a defensible secondary-market estimate and may use current listings. Separately return lastSaleValue, lastSaleDate, lastSaleVenue, and lastSaleSourceUrl only when a source proves a completed auction or secondary-market transaction for the exact cigar identity; never treat an asking price, open auction, estimate, or unavailable lot as a completed sale. Normalize a completed lot total per cigar. Use null for every lastSale field when no verified completed sale is found. For Cuban, vintage, discontinued, or collector presentations, prioritize reputable auction archives and specialist dealers. Do not invent a value when packaging or vintage prevents a clean comparison: use null and explain. source/sourceUrl identify the strongest general price comparable. evidenceDate must be today's date in YYYY-MM-DD. Keep notes under 500 characters and each comparable note under 180 characters. This is research evidence, not an appraisal.`;
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_VALUATION_MODEL?.trim()||"gpt-5-mini",reasoning:{effort:"low"},store:false,max_output_tokens:2600,tools:[{type:"web_search"}],include:["web_search_call.action.sources"],input:prompt,text:{format:{type:"json_schema",name:"valuation_research",strict:true,schema:valuationResearchJsonSchema}}}),signal:AbortSignal.timeout(90_000)});
  const payload=await response.json();if(!response.ok)throw new Error((payload as {error?:{message?:string}}).error?.message||`OpenAI request failed (${response.status})`);const text=responseOutputText(payload);if(!text)throw new Error("Research returned no valuation draft");return parseValuationResearch(text);
}
