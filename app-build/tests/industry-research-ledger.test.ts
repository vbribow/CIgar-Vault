import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeResearchSourceUrl } from "../lib/catalog-knowledge";
import { dossierKnowledgeProposals } from "../lib/industry-research-ledger";

test("weekly dossier becomes exact private field-level proposals",()=>{const proposals=dossierKnowledgeProposals();assert.equal(proposals.length,14);assert.equal(proposals.every(item=>item.sourceWorkflow==="weekly-industry-source"),true);assert.equal(proposals.every(item=>item.facts.map(f=>f.field).join(",")==="dimensions,packaging,country,wrapper"),true);assert.equal(new Set(proposals.map(item=>item.identityKey)).size,14)});
test("source normalization removes tracking and fragments for deduplication",()=>{assert.equal(normalizeResearchSourceUrl("https://example.com/cigars/?utm_source=x&ref=y#formats"),"https://example.com/cigars")});
test("ledger is founder-only and has no publication action",()=>{const route=readFileSync(new URL("../app/api/industry-research-ledger/route.ts",import.meta.url),"utf8");const ui=readFileSync(new URL("../components/industry-research-ledger.tsx",import.meta.url),"utf8");assert.match(route,/authorizeWrite/);assert.match(route,/reviewResearchFact/);assert.doesNotMatch(route,/publish/i);assert.match(ui,/no public publishing action/i);assert.match(ui,/Research deeper/)});
