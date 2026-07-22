import { z } from "zod";
import type { InventoryItem } from "./types";
import { responseOutputText } from "./cigar-vision";

export const ValuationResearchSchema = z.object({
  replacementValue: z.number().nonnegative().nullable(), marketValue: z.number().nonnegative().nullable(), source: z.string(), sourceUrl: z.string(),
  confidence: z.enum(["High", "Medium", "Low"]), evidenceDate: z.string(), notes: z.string(), comparables: z.array(z.object({ title: z.string(), url: z.string(), unitPrice: z.number().nonnegative().nullable(), notes: z.string() })),
});
export type ValuationResearch = z.infer<typeof ValuationResearchSchema>;
export const valuationResearchJsonSchema = { type:"object", additionalProperties:false, properties:{ replacementValue:{type:["number","null"],minimum:0},marketValue:{type:["number","null"],minimum:0},source:{type:"string"},sourceUrl:{type:"string"},confidence:{type:"string",enum:["High","Medium","Low"]},evidenceDate:{type:"string"},notes:{type:"string"},comparables:{type:"array",items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},url:{type:"string"},unitPrice:{type:["number","null"],minimum:0},notes:{type:"string"}},required:["title","url","unitPrice","notes"]}}},required:["replacementValue","marketValue","source","sourceUrl","confidence","evidenceDate","notes","comparables"]} as const;

export async function researchInventoryValuation(item:InventoryItem){
  const apiKey=process.env.OPENAI_API_KEY?.trim();if(!apiKey)throw new Error("Valuation research is not configured");
  const prompt=`Research current pricing evidence for this cigar inventory lot: ${item.brand}; line ${item.line}; vitola ${item.vitola}; vintage/release ${item.vintage??"unknown"}; packaging ${item.packaging??"unknown"}; quantity ${item.currentQty??"unknown"}. Find up to three direct, current comparable pages. Return USD values per individual cigar, never box totals. Normalize box prices by the documented cigar count. For Cuban, vintage, discontinued, or collector presentations, prioritize reputable auction or specialist market evidence and explain buyer premiums or condition differences. For regular production cigars, prioritize manufacturer or established retailer pricing. Do not invent a value when packaging or vintage prevents a clean comparison: use null and explain. source/sourceUrl must identify the strongest comparable. evidenceDate must be today's date in YYYY-MM-DD. This is research evidence, not an appraisal.`;
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_VISION_MODEL?.trim()||"gpt-5.6-terra",reasoning:{effort:"low"},store:false,max_output_tokens:1600,tools:[{type:"web_search"}],include:["web_search_call.action.sources"],input:prompt,text:{format:{type:"json_schema",name:"valuation_research",strict:true,schema:valuationResearchJsonSchema}}}),signal:AbortSignal.timeout(90_000)});
  const payload=await response.json();if(!response.ok)throw new Error((payload as {error?:{message?:string}}).error?.message||`OpenAI request failed (${response.status})`);const text=responseOutputText(payload);if(!text)throw new Error("Research returned no valuation draft");return ValuationResearchSchema.parse(JSON.parse(text));
}
