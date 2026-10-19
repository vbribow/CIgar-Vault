import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { manufacturerClaimDecision,manufacturerClaimsFromReport,mergeManufacturerEvidence,selectManufacturerResearchBatch } from "../lib/manufacturer-evidence";
import type { BrandResearchItem } from "../lib/brand-research";
import type { ManufacturerClaim,ManufacturerRun } from "../lib/manufacturer-evidence";

const item=(brand:string,priority:BrandResearchItem["priority"]="Boutique priority"):BrandResearchItem=>({brand,priority,primaryRegion:"Nicaragua",segment:"Boutique",status:"Research needed",manufacturing:"Unknown",evidence:"Gap",href:"#",missing:["factory","source"]});

test("manufacturer batches are capped and skip active or cooling brands",()=>{
  const now=new Date("2026-10-19T20:00:00Z"),runs:ManufacturerRun[]=[
    {run_id:"1",brand_key:"alpha",brand:"Alpha",status:"in_progress",started_at:"2026-10-19T19:00:00Z"},
    {run_id:"2",brand_key:"beta",brand:"Beta",status:"completed",started_at:"2026-10-01T00:00:00Z",next_eligible_at:"2027-04-01T00:00:00Z"},
  ];
  assert.deepEqual(selectManufacturerResearchBatch([item("Alpha"),item("Beta"),item("Gamma"),item("Delta"),item("Epsilon")],runs,20,now).map(value=>value.brand),["Gamma","Delta","Epsilon"]);
});

test("only verified high-confidence official HTTPS evidence auto-approves",()=>{
  assert.equal(manufacturerClaimDecision({status:"Verified",confidence:"High",sourceType:"Official",sourceUrl:"https://maker.example/release"}),"auto_approved");
  assert.equal(manufacturerClaimDecision({status:"Verified",confidence:"High",sourceType:"Verified Historical",sourceUrl:"https://trade.example/story"}),"pending");
  assert.equal(manufacturerClaimDecision({status:"Partially verified",confidence:"High",sourceType:"Official",sourceUrl:"https://maker.example/release"}),"pending");
});

test("reports become deduplicated scoped evidence claims",()=>{
  const claims=manufacturerClaimsFromReport({brand:"Example",researchedAt:"2026-10-19",summary:"Summary",brandOwner:{value:"Example LLC",status:"Verified",confidence:"High",sourceTitle:"About",sourceUrl:"https://example.com/about",sourceType:"Official",evidenceDate:"2026-10-19",notes:""},creativeAuthorship:[],manufacturingRelationships:[{factory:"Factory One",country:"Nicaragua",lineOrRelease:"Reserva Toro",productionPeriod:"2025-present",relationship:"Contract",status:"Verified",confidence:"High",sourceTitle:"Release",sourceUrl:"https://example.com/release",sourceType:"Official",evidenceDate:"2026-10-19",notes:"Scoped."}],officialSources:[],unresolvedQuestions:[]},"00000000-0000-0000-0000-000000000001");
  assert.equal(claims.length,2);assert.equal(claims[1]?.scope,"Reserva Toro");assert.equal(claims[1]?.decision,"auto_approved");assert.equal(claims[1]?.claim_hash.length,64);
});

test("Brand Universe uses approved manufacturing evidence without expanding its scope",()=>{
  const claim={claim_id:"c",brand_key:"example",brand:"Example",claim_type:"manufacturing",scope:"Reserva Toro",claim_value:"Factory One",country:"Nicaragua",production_period:"2025-present",relationship:"Contract",source_title:"Release",source_url:"https://example.com/release",source_type:"Official",evidence_date:"2026-10-19",confidence:"High",evidence_status:"Verified",decision:"auto_approved",created_at:"2026-10-19"} satisfies ManufacturerClaim;
  const [record]=mergeManufacturerEvidence([{brand:"Example",primaryRegion:"Nicaragua",segment:"Boutique",status:"Research needed",manufacturing:"Unknown",evidence:"Gap",href:"#"}],[claim]);
  assert.equal(record.status,"Factory verified");assert.match(record.manufacturing,/Factory One — Reserva Toro \(2025-present\)/);assert.doesNotMatch(record.manufacturing,/all cigars/i);
});

test("paid manufacturer research requires founder authorization and explicit credit consent",async()=>{
  const route=await readFile(new URL("../app/api/brand-research/batch/route.ts",import.meta.url),"utf8");
  assert.match(route,/authorizeWrite\(request\)/);
  assert.match(route,/confirmCreditSpend:z\.literal\(true\)/);
  assert.match(route,/max\(MANUFACTURER_BATCH_MAX\)/);
});

test("manufacturer evidence tables remain private service-role ledgers",async()=>{
  const migration=await readFile(new URL("../supabase/migrations/202610190002_manufacturer_evidence.sql",import.meta.url),"utf8");
  assert.match(migration,/manufacturer_research_runs enable row level security/);
  assert.match(migration,/manufacturer_evidence_claims enable row level security/);
  assert.doesNotMatch(migration,/create policy/i);
});
