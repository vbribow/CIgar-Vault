import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { canonicalCigarIdentity } from "./cigar-identity";

export const CigarKnowledgeField = z.enum([
  "country", "factory", "brandOwner", "blender", "wrapper", "binder", "filler",
  "wrapperOrigin", "binderOrigin", "fillerOrigins", "dimensions", "strength",
  "releaseYear", "edition", "packaging",
]);
export type CigarKnowledgeField = z.infer<typeof CigarKnowledgeField>;

const Evidence = z.object({
  field: CigarKnowledgeField,
  value: z.string().trim().min(1),
  sourceUrl: z.string().url(),
  sourceTitle: z.string().trim().min(1),
  sourceType: z.enum(["Official", "Verified Historical", "Expert", "Community", "AI-assisted"]),
  confidence: z.enum(["High", "Medium", "Low"]),
  evidenceDate: z.string().trim(),
});

export const CigarKnowledgeProposalSchema = z.object({
  profileId: z.string().min(1),
  identityKey: z.string().min(1),
  brand: z.string().min(1),
  line: z.string().min(1),
  vitola: z.string().min(1),
  sourceWorkflow: z.string().min(1),
  candidate: z.record(z.string(), z.unknown()),
  facts: z.array(Evidence).min(1),
});
export type CigarKnowledgeProposal = z.infer<typeof CigarKnowledgeProposalSchema>;

type DiscoveryCandidate = {
  brand: string; line: string; vitola: string; sourceUrl: string; sourceTitle: string;
  evidenceDate: string; confidence: "High" | "Medium" | "Low";
} & Partial<Record<CigarKnowledgeField, string>>;

export function knowledgeProposalFromDiscovery(item: DiscoveryCandidate): CigarKnowledgeProposal {
  const identity = canonicalCigarIdentity({ ...item, vintage: item.releaseYear });
  const facts = CigarKnowledgeField.options.flatMap(field => {
    const value = item[field]?.trim();
    return !value || value === "Unresolved" ? [] : [{
      field,
      value,
      sourceUrl: item.sourceUrl,
      sourceTitle: item.sourceTitle,
      sourceType: "AI-assisted" as const,
      confidence: item.confidence,
      evidenceDate: item.evidenceDate,
    }];
  });
  return CigarKnowledgeProposalSchema.parse({
    profileId: identity.identityId,
    identityKey: identity.identityKey,
    brand: item.brand,
    line: item.line,
    vitola: item.vitola,
    sourceWorkflow: "catalog-discovery",
    candidate: item,
    facts,
  });
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : undefined;
}

export async function queueCigarKnowledgeProposals(values: CigarKnowledgeProposal[]) {
  const client = admin();
  if (!client || values.length === 0) return { queued: 0, facts: 0, status: client ? "no-evidence" : "not-configured" };
  let queued = 0;
  let factCount = 0;
  for (const value of values.map(item => CigarKnowledgeProposalSchema.parse(item))) {
    const profile = {
      profile_id: value.profileId,
      identity_key: value.identityKey,
      brand: value.brand,
      line: value.line,
      vitola: value.vitola,
      updated_at: new Date().toISOString(),
    };
    const profileResult = await client.from("cigar_knowledge_profiles").upsert(profile, { onConflict: "profile_id", ignoreDuplicates: false });
    if (profileResult.error) {
      if (/relation .* does not exist/i.test(profileResult.error.message)) return { queued, facts: factCount, status: "schema-pending" };
      throw profileResult.error;
    }
    const proposalResult = await client.from("cigar_knowledge_proposals").insert({
      profile_id: value.profileId,
      source_workflow: value.sourceWorkflow,
      candidate_payload: value.candidate,
    }).select("proposal_id").single();
    if (proposalResult.error) throw proposalResult.error;
    const proposalId = proposalResult.data.proposal_id;
    const facts = value.facts.map(fact => ({
      proposal_id: proposalId,
      profile_id: value.profileId,
      field_name: fact.field,
      proposed_value: fact.value,
      source_url: fact.sourceUrl,
      source_title: fact.sourceTitle,
      source_type: fact.sourceType,
      confidence: fact.confidence,
      evidence_date: fact.evidenceDate || null,
    }));
    if (facts.length) {
      const factsResult = await client.from("cigar_knowledge_facts").insert(facts);
      if (factsResult.error) throw factsResult.error;
    }
    const revisionResult = await client.from("cigar_knowledge_revisions").insert({
      profile_id: value.profileId,
      proposal_id: proposalId,
      action: "proposal-created",
      actor: value.sourceWorkflow,
      snapshot: { candidate: value.candidate, facts: value.facts },
    });
    if (revisionResult.error) throw revisionResult.error;
    queued++;
    factCount += facts.length;
  }
  return { queued, facts: factCount, status: "review-ready" };
}
