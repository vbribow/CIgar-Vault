import type { CigarCollection, ProfessionalRating, Valuation } from "./types";

export type EvidenceKind="Official"|"Editorial"|"Community"|"Automated research"|"Collector statement"|"Inference";
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

const confidence=(value?:string):EvidenceConfidence=>value==="High"||value==="Medium"||value==="Low"?value:"Unrated";

export function valuationEvidence(value:Valuation):TrustEvidence{
  return{kind:value.source?.toLowerCase().includes("automated")?"Automated research":"Editorial",sourceName:value.source||"Source not named",sourceUrl:value.sourceUrl,observedAt:value.valuationDate,confidence:confidence(value.confidence),supports:"Per-cigar value evidence",commercialInfluence:"Unknown"};
}

export function ratingEvidence(value:ProfessionalRating):TrustEvidence{
  return{kind:"Editorial",sourceName:value.publication,sourceUrl:value.sourceUrl,observedAt:value.reviewDate||value.createdAt.slice(0,10),confidence:value.matchConfidence,supports:"Published rating for the matched cigar identity",commercialInfluence:"Unknown"};
}

export function collectionEvidence(value:CigarCollection,fallback?:{name:string;url:string;date?:string}):TrustEvidence{
  const sourceName=value.valuationSource||fallback?.name||"Collector record";
  return{kind:value.valuationSource||fallback?"Editorial":"Collector statement",sourceName,sourceUrl:value.valuationSourceUrl||fallback?.url,observedAt:value.valuationDate||fallback?.date,confidence:value.wholeMarketValue!==undefined?"Medium":"Unrated",supports:value.wholeMarketValue!==undefined?"Whole-collection value":"Collection identity and contents",commercialInfluence:"Unknown"};
}

export function evidenceLabel(value:TrustEvidence){return `${value.kind} · ${value.confidence} confidence${value.observedAt?` · ${value.observedAt}`:""}`}
