import type { CatalogCigar } from "./types";

export const blendResearchFields = ["wrapper","wrapperOrigin","binder","binderOrigin","filler","fillerOrigins","strength"] as const;
export type BlendResearchState = "Source-backed" | "Partial evidence" | "Needs product source" | "Queued for research";

function present(value:unknown){return String(value??"").trim().length>0}

export function blendResearchState(item:CatalogCigar):BlendResearchState{
  const documented=blendResearchFields.filter(field=>present(item[field])).length;
  if(documented===blendResearchFields.length&&present(item.sourceUrl))return "Source-backed";
  if(documented>0&&present(item.sourceUrl))return "Partial evidence";
  if(documented>0)return "Needs product source";
  return "Queued for research";
}

export function blendResearchCoverage(catalog:CatalogCigar[]){
  const records=catalog.map(item=>({item,state:blendResearchState(item),documented:blendResearchFields.filter(field=>present(item[field])).length,total:blendResearchFields.length}));
  const count=(state:BlendResearchState)=>records.filter(record=>record.state===state).length;
  return{records,total:records.length,sourceBacked:count("Source-backed"),partial:count("Partial evidence"),needsSource:count("Needs product source"),queued:count("Queued for research")};
}
