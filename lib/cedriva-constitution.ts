export const cedrivaPrinciples = [
  { question:"Does this educate?", commitment:"Make expertise accessible without diminishing its depth." },
  { question:"Does this build trust?", commitment:"Show sources, uncertainty, corrections, and human judgment." },
  { question:"Does this strengthen the community?", commitment:"Welcome new collectors and amplify experienced voices." },
  { question:"Does this preserve the culture?", commitment:"Use technology to support craftsmanship, ritual, history, and industry partners." },
] as const;

export type CedrivaDecision = { educates:boolean; buildsTrust:boolean; strengthensCommunity:boolean; preservesCulture:boolean };
export function constitutionalDecision(input:CedrivaDecision){
  const passed=Object.values(input).filter(Boolean).length;
  return {passed,total:4,approved:passed===4,outcome:passed===4?"Proceed":"Rethink" as "Proceed"|"Rethink"};
}
