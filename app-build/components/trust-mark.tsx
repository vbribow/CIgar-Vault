import type { EvidenceConfidence, EvidenceKind } from "@/lib/trust-evidence";
import { trustDefinition } from "@/lib/trust-evidence";

export function TrustMark({kind,confidence,compact=false}:{kind:EvidenceKind;confidence?:EvidenceConfidence|"Developing";compact?:boolean}){
  const definition=trustDefinition(kind);
  return <span className="trustMark" data-level={kind} title={definition.description}>
    <b>{definition.level}</b>
    <span>{kind}</span>
    {!compact&&confidence&&<small>{confidence} confidence</small>}
  </span>;
}
