import { z } from "zod";
import { isPhysicalVitola } from "./vitolas";

export const VitolaResearchSchema=z.object({vitolas:z.array(z.object({
  name:z.string().min(1),
  lengthInches:z.number().positive().nullable(),
  ringGauge:z.number().int().positive().nullable(),
  sourceUrl:z.string().url(),
  evidence:z.string(),
})).max(40)});

export function researchedVitolaLabel(item:z.infer<typeof VitolaResearchSchema>["vitolas"][number]){
  const dimensions=item.lengthInches&&item.ringGauge?`${item.lengthInches} × ${item.ringGauge}`:"";
  return[item.name,dimensions].filter(Boolean).join(" — ");
}

export function physicalVitolaResearch(value:unknown){
  const parsed=VitolaResearchSchema.parse(value);
  return parsed.vitolas.filter(item=>isPhysicalVitola(item.name)||Boolean(item.lengthInches&&item.ringGauge));
}

export const vitolaResearchJsonSchema={type:"object",additionalProperties:false,properties:{vitolas:{type:"array",maxItems:40,items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},lengthInches:{type:["number","null"]},ringGauge:{type:["integer","null"]},sourceUrl:{type:"string"},evidence:{type:"string"}},required:["name","lengthInches","ringGauge","sourceUrl","evidence"]}}},required:["vitolas"]} as const;
