import type { CigarCollection, ProfessionalRating, Valuation } from "./types";

export type EvidenceKind="Official"|"Verified Historical"|"Expert"|"Community"|"AI";
export type EvidenceConfidence="High"|"Medium"|"Low"|"Unrated";
export type TrustEvidence={
  kind:EvidenceKind;
  sourceName:string;
  sourceUrl?:string;
  observedAt?:string;
  confidence:EvidenceConfidence;
  supports:string;
  commercialInfluence:"None disclosed"|"Disclosed"|"Unknown";
};

export const trustFramework=[
  {kind:"Official",level:1,description:"Information supplied or confirmed by an authorized manufacturer or organization.",question:"Who officially supplied this?"},
  {kind:"Verified Historical",level:2,description:"Information confirmed through multiple trusted or primary historical sources.",question:"Which independent records support this?"},
  {kind:"Expert",level:3,description:"Attributable knowledge from a verified expert or established independent publication.",question:"Who is the expert and what is their field?"},
  {kind:"Community",level:4,description:"Collector experience, opinion, observation, review, or shared knowledge.",question:"Whose lived experience is this?"},
  {kind:"AI",level:5,description:"An AI-assisted inference or recommendation derived from permitted data.",question:"Which evidence and limitations shaped this insight?"},
] as const satisfies ReadonlyArray<{kind:EvidenceKind;level:number;description:string;question:string}>;

export function trustDefinition(kind:EvidenceKind){return trustFramework.find(value=>value.kind===kind)!}

const confidence=(value?:string):EvidenceConfidence=>value==="High"||value==="Medium"||value==="Low"?value:"Unrated";

export function valuationEvidence(value:Valuation):TrustEvidence{
  return{kind:value.source?.toLowerCase().includes("automated")?"AI":"Expert",sourceName:value.source||"Source not named",sourceUrl:value.sourceUrl,observedAt:value.valuationDate,confidence:confidence(value.confidence),supports:"Per-cigar value evidence",commercialInfluence:"Unknown"};
}

export function ratingEvidence(value:ProfessionalRating):TrustEvidence{
  return{kind:"Expert",sourceName:value.publication,sourceUrl:value.sourceUrl,observedAt:value.reviewDate||value.createdAt.slice(0,10),confidence:value.matchConfidence,supports:"Published rating for the matched cigar identity",commercialInfluence:"Unknown"};
}

export function collectionEvidence(value:CigarCollection,fallback?:{name:string;url:string;date?:string}):TrustEvidence{
  const sourceName=value.valuationSource||fallback?.name||"Collector record";
  return{kind:value.valuationSource||fallback?"Verified Historical":"Community",sourceName,sourceUrl:value.valuationSourceUrl||fallback?.url,observedAt:value.valuationDate||fallback?.date,confidence:value.wholeMarketValue!==undefined?"Medium":"Unrated",supports:value.wholeMarketValue!==undefined?"Whole-collection value":"Collection identity and contents",commercialInfluence:"Unknown"};
}

export function evidenceLabel(value:TrustEvidence){return `${value.kind} · ${value.confidence} confidence${value.observedAt?` · ${value.observedAt}`:""}`}
