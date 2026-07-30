import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { knowledgeProposalFromDiscovery } from "../lib/catalog-knowledge";

test("catalog discovery becomes field-level evidence without publishing unresolved facts", () => {
  const proposal = knowledgeProposalFromDiscovery({
    brand: "Example", line: "Reserva", vitola: "Toro", dimensions: "6 × 52",
    wrapper: "Habano", binder: "Unresolved", filler: "Nicaraguan",
    sourceUrl: "https://example.com/reserva", sourceTitle: "Official product page",
    evidenceDate: "2026-07-30", confidence: "High",
  });
  assert.equal(proposal.brand, "Example");
  assert.deepEqual(proposal.facts.map(fact => fact.field), ["wrapper", "filler", "dimensions"]);
  assert.equal(proposal.facts.every(fact => fact.sourceUrl === "https://example.com/reserva"), true);
});

test("release timing creates a distinct knowledge identity", () => {
  const base = { brand: "Example", line: "Reserva", vitola: "Toro", dimensions: "6 × 52", sourceUrl: "https://example.com/reserva", sourceTitle: "Official", evidenceDate: "2026-07-30", confidence: "High" as const };
  assert.notEqual(
    knowledgeProposalFromDiscovery({ ...base, releaseYear: "2025" }).identityKey,
    knowledgeProposalFromDiscovery({ ...base, releaseYear: "2026" }).identityKey,
  );
});

test("shared knowledge schema preserves proposals, field facts, and immutable revisions", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202607300001_cigar_knowledge.sql", import.meta.url), "utf8");
  assert.match(migration, /cigar_knowledge_profiles/);
  assert.match(migration, /cigar_knowledge_proposals/);
  assert.match(migration, /cigar_knowledge_facts/);
  assert.match(migration, /cigar_knowledge_revisions/);
  assert.match(migration, /enable row level security/);
  assert.doesNotMatch(migration, /create policy/);
});

test("discovery queues shared knowledge separately from the legacy catalog review", () => {
  const route = readFileSync(new URL("../app/api/catalog-discovery/run/route.ts", import.meta.url), "utf8");
  assert.match(route, /queueCigarKnowledgeProposals/);
  assert.match(route, /researchStatus:"Pending review"/);
  assert.match(route, /sourceType:"AI-assisted"/);
});
