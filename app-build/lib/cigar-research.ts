import { z } from "zod";
import { availabilityResearchJsonSchema, AvailabilityResearchSchema } from "./availability-research";

const facts = ["brand","line","vitola","dimensions","country","factory","blender","wrapper","binder","filler","strength","packaging","releaseYear","edition","summary"] as const;
const FactShape = Object.fromEntries(facts.map(field=>[field,z.string()])) as Record<typeof facts[number],z.ZodString>;
export const CigarResearchSchema=z.object({profile:z.object(FactShape),confidence:z.enum(["High","Medium","Low"]),uncertainties:z.array(z.string()).max(12),sources:z.array(z.object({name:z.string(),url:z.string().url(),supports:z.string()})).max(12),availability:AvailabilityResearchSchema});
export type CigarResearch=z.infer<typeof CigarResearchSchema>;
export const cigarResearchJsonSchema={type:"object",additionalProperties:false,properties:{profile:{type:"object",additionalProperties:false,properties:Object.fromEntries(facts.map(field=>[field,{type:"string"}])),required:[...facts]},confidence:{type:"string",enum:["High","Medium","Low"]},uncertainties:{type:"array",maxItems:12,items:{type:"string"}},sources:{type:"array",maxItems:12,items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},url:{type:"string"},supports:{type:"string"}},required:["name","url","supports"]}},availability:{type:"object",additionalProperties:false,properties:availabilityResearchJsonSchema.properties,required:availabilityResearchJsonSchema.required}},required:["profile","confidence","uncertainties","sources","availability"]} as const;
