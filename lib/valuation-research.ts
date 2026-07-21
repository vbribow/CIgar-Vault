import { z } from "zod";

export const ValuationResearchSchema = z.object({
  replacementValue: z.number().nonnegative().nullable(), marketValue: z.number().nonnegative().nullable(), source: z.string(), sourceUrl: z.string(),
  confidence: z.enum(["High", "Medium", "Low"]), evidenceDate: z.string(), notes: z.string(), comparables: z.array(z.object({ title: z.string(), url: z.string(), unitPrice: z.number().nonnegative().nullable(), notes: z.string() })),
});
export type ValuationResearch = z.infer<typeof ValuationResearchSchema>;
export const valuationResearchJsonSchema = { type:"object", additionalProperties:false, properties:{ replacementValue:{type:["number","null"],minimum:0},marketValue:{type:["number","null"],minimum:0},source:{type:"string"},sourceUrl:{type:"string"},confidence:{type:"string",enum:["High","Medium","Low"]},evidenceDate:{type:"string"},notes:{type:"string"},comparables:{type:"array",items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},url:{type:"string"},unitPrice:{type:["number","null"],minimum:0},notes:{type:"string"}},required:["title","url","unitPrice","notes"]}}},required:["replacementValue","marketValue","source","sourceUrl","confidence","evidenceDate","notes","comparables"]} as const;
