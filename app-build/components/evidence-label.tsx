import type { TrustEvidence } from "@/lib/trust-evidence";
import { evidenceLabel } from "@/lib/trust-evidence";
export function EvidenceLabel({evidence}:{evidence:TrustEvidence}){return <aside className="evidenceLabel"><span>{evidenceLabel(evidence)}</span><strong>{evidence.sourceName}</strong><small>{evidence.supports}</small>{evidence.sourceUrl&&<a href={evidence.sourceUrl} target="_blank" rel="noreferrer">Review evidence ↗</a>}</aside>}
