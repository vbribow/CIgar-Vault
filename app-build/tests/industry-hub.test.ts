import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  IndustryProfileInput,
  IndustryPublicationInput,
  industryRevision,
  publicIndustryPayload,
  publicationTypeLabel,
} from "../lib/industry-hub";

test("validates substantive official profiles and newsroom statements",()=>{
  const profile=IndustryProfileInput.parse({
    partnerId:"2544af61-5328-4a82-9780-b50c996b298f",
    displayName:"Example Cigar Company",
    summary:"A sufficiently detailed official summary of the organization and its work.",
    history:"A substantive official history describing the organization, its people, its factories, and the traditions it intends to preserve.",
    foundedYear:1998,
    websiteUrl:"https://example.com",
  });
  assert.equal(profile.foundedYear,1998);
  const publication=IndustryPublicationInput.parse({
    partnerId:profile.partnerId,
    type:"packaging_change",
    title:"Official packaging revision announced",
    summary:"The organization is documenting a packaging change for collector reference.",
    body:"This official statement contains enough detail to explain what changed, when the change becomes effective, how collectors can recognize it, and where to find the canonical source.",
    effectiveDate:"2026-08-01",
  });
  assert.equal(publicationTypeLabel(publication.type),"Packaging Change");
});

test("public content comes only from a previously published payload",()=>{
  const published={title:"Published version"};
  assert.deepEqual(publicIndustryPayload({status:"published",published_payload:published}),published);
  assert.deepEqual(publicIndustryPayload({status:"submitted",published_payload:published}),published);
  assert.equal(publicIndustryPayload({status:"draft",published_payload:null}),undefined);
  assert.equal(publicIndustryPayload({status:"suspended",published_payload:published}),undefined);
  assert.equal(publicIndustryPayload({status:"archived",published_payload:published}),undefined);
});

test("industry revisions preserve actor, action, entity, and snapshot",()=>{
  assert.deepEqual(industryRevision({
    partnerId:"2544af61-5328-4a82-9780-b50c996b298f",
    entityType:"publication",
    entityId:"c11a0f8b-b455-4870-8ba8-59e5e999a80d",
    action:"founder.published",
    actor:"founder",
    snapshot:{title:"Official release"},
  }),{
    partner_id:"2544af61-5328-4a82-9780-b50c996b298f",
    entity_type:"publication",
    entity_id:"c11a0f8b-b455-4870-8ba8-59e5e999a80d",
    action:"founder.published",
    actor:"founder",
    snapshot:{title:"Official release"},
  });
});

test("Industry Hub migration creates no content and never modifies Fox",async()=>{
  const migration=await readFile(new URL("../supabase/migrations/202607240005_industry_hub.sql",import.meta.url),"utf8");
  assert.doesNotMatch(migration,/insert\s+into\s+public\.industry_/i);
  assert.doesNotMatch(migration,/update\s+public\.partners/i);
  assert.match(migration,/does not modify the founder-locked Fox record/i);
});

test("founder publication remains separate from approval",async()=>{
  const route=await readFile(new URL("../app/api/partners/route.ts",import.meta.url),"utf8");
  assert.match(route,/reviewIndustryProfile/);
  assert.match(route,/publishIndustryProfile/);
  assert.match(route,/reviewIndustryPublication/);
  assert.match(route,/publishIndustryPublication/);
  assert.match(route,/requires separate founder approval before publication/i);
  assert.match(route,/organization_identity/);
  assert.match(route,/authorized_contact/);
  assert.match(route,/brand_profile/);
});

test("partner workspace cannot publish or self-verify official content",async()=>{
  const route=await readFile(new URL("../app/api/partner-workspace/route.ts",import.meta.url),"utf8");
  assert.match(route,/saveIndustryProfile/);
  assert.match(route,/submitIndustryProfile/);
  assert.match(route,/saveIndustryPublication/);
  assert.match(route,/submitIndustryPublication/);
  assert.doesNotMatch(route,/action:z\.literal\("publishIndustry/);
  assert.doesNotMatch(route,/action:z\.literal\("reviewIndustry/);
});

test("public Industry Hub visibly identifies official source limits",async()=>{
  const page=await readFile(new URL("../app/industry/page.tsx",import.meta.url),"utf8");
  const profile=await readFile(new URL("../app/industry/[slug]/page.tsx",import.meta.url),"utf8");
  assert.match(page,/TrustMark kind="Official"/);
  assert.match(page,/does not mean Cedriva independently endorses every claim/i);
  assert.match(page,/Drafts and submissions never appear here/i);
  assert.match(profile,/Authorized organization/);
  assert.match(profile,/Revision and correction history/);
});

test("published Industry Hub pages are publicly reachable",async()=>{
  const proxy=await readFile(new URL("../lib/supabase/proxy.ts",import.meta.url),"utf8");
  const navigation=await readFile(new URL("../components/app-navigation.tsx",import.meta.url),"utf8");
  assert.match(proxy,/pathname === ["']\/industry["']/);
  assert.match(proxy,/startsWith\(["']\/industry\/["']\)/);
  assert.match(navigation,/Industry Hub/);
});
