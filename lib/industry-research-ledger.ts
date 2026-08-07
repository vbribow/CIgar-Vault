import { CigarKnowledgeProposalSchema, normalizeResearchSourceUrl } from "./catalog-knowledge";
import { opusXSingleSourcePilot, SingleSourceDossier } from "./industry-source-pilot";
import { canonicalCigarIdentity } from "./cigar-identity";

export const WEEKLY_INDUSTRY_WORKFLOW = "weekly-industry-source";

export function dossierKnowledgeProposals(dossier: SingleSourceDossier = opusXSingleSourcePilot) {
  const sourceUrl = normalizeResearchSourceUrl(dossier.source.url);
  return dossier.vitolas.map(vitola => {
    const dimensions = `${vitola.lengthInches} × ${vitola.ringGauge}`;
    const identity = canonicalCigarIdentity({ brand: dossier.organization, line: dossier.productLine, vitola: vitola.name });
    const common = { sourceUrl, sourceTitle: dossier.source.title, sourceType: "Official" as const, confidence: "High" as const, evidenceDate: dossier.source.checkedAt };
    return CigarKnowledgeProposalSchema.parse({
      profileId: identity.identityId, identityKey: identity.identityKey, brand: dossier.organization, line: dossier.productLine, vitola: vitola.name,
      sourceWorkflow: WEEKLY_INDUSTRY_WORKFLOW,
      candidate: { dossierId: dossier.dossierId, organization: dossier.organization, productLine: dossier.productLine, brand: dossier.organization, line: dossier.productLine, vitola: vitola.name, dimensions, packaging: `${vitola.perBox} per box`, sourceUrl, stage: "Stage 1 foundation", unresolved: dossier.unresolved },
      facts: [
        { field: "dimensions", value: dimensions, ...common },
        { field: "packaging", value: `${vitola.perBox} per box`, ...common },
        { field: "country", value: "Dominican Republic", ...common },
        { field: "wrapper", value: "Fuente Fuente OpusX wrapper tobacco", ...common },
      ],
    });
  });
}

export function summarizeResearchCoverage(proposals: Array<{status?:string}>, facts: Array<{status?:string}>) {
  const accepted = facts.filter(item => item.status === "approved").length;
  const rejected = facts.filter(item => item.status === "rejected").length;
  const deeper = facts.filter(item => item.status === "pending" && String((item as {review_note?:string}).review_note || "").startsWith("Deeper research requested")).length;
  return { dossiers: new Set(proposals.map(item => JSON.stringify(item))).size ? 1 : 0, profiles: proposals.length, facts: facts.length, accepted, rejected, deeper, pending: facts.length - accepted - rejected - deeper };
}
