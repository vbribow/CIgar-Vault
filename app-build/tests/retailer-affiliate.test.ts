import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  RetailerAffiliateProgramSchema,
  affiliateActivationIssues,
  affiliateConfigurationAudit,
  decorateRetailerListings,
  parseRetailerAffiliatePrograms,
} from "../lib/retailer-affiliate";
import type { AvailabilityListing } from "../lib/types";

const activeProgram = RetailerAffiliateProgramSchema.parse({
  programName:"Example retailer affiliate",
  retailerName:"Example Cigars",
  domains:["shop.example.com"],
  status:"active",
  queryParameter:"aff",
  queryValue:"hojavia",
  disclosureText:"Hojavía may receive compensation if you purchase through this link. Compensation does not affect the result or price shown.",
  agreementReviewedAt:"2026-07-29T12:00:00.000Z",
  legalReviewedAt:"2026-07-29T12:00:00.000Z",
  privacyReviewedAt:"2026-07-29T12:00:00.000Z",
  ageAndJurisdictionReviewedAt:"2026-07-29T12:00:00.000Z",
  founderApprovedAt:"2026-07-29T12:00:00.000Z",
  editorialIndependenceConfirmed:true,
});

const listings:AvailabilityListing[]=[
  {seller:"Independent",sellerType:"Authorized retailer",title:"Exact cigar A",url:"https://independent.example/a",availability:"In stock",unitPrice:20,notes:"Exact match"},
  {seller:"Example Cigars",sellerType:"Authorized retailer",title:"Exact cigar B",url:"https://shop.example.com/b?size=single",availability:"In stock",unitPrice:19,notes:"Exact match"},
];

test("active affiliate decoration adds only the approved retailer parameter and disclosure",()=>{
  assert.deepEqual(affiliateActivationIssues(activeProgram),[]);
  const decorated=decorateRetailerListings(listings,[activeProgram]);
  assert.equal(decorated[0].outboundUrl,undefined);
  assert.equal(decorated[1].outboundUrl,"https://shop.example.com/b?size=single&aff=hojavia");
  assert.equal(decorated[1].commercialRelationship,"Affiliate — compensated link");
  assert.match(decorated[1].commercialDisclosure||"",/receive compensation/i);
});

test("commercial decoration never changes research ordering, identity, or price",()=>{
  const decorated=decorateRetailerListings(listings,[activeProgram]);
  assert.deepEqual(decorated.map(item=>item.url),listings.map(item=>item.url));
  assert.deepEqual(decorated.map(item=>item.unitPrice),listings.map(item=>item.unitPrice));
  assert.deepEqual(decorated.map(item=>item.title),listings.map(item=>item.title));
});

test("incomplete, paused, malformed, and lookalike-domain programs fail closed",()=>{
  const paused={...activeProgram,status:"paused" as const};
  assert.ok(affiliateActivationIssues(paused).length>0);
  assert.equal(decorateRetailerListings(listings,[paused])[1].outboundUrl,undefined);
  assert.deepEqual(parseRetailerAffiliatePrograms("{not-json"),[]);
  const lookalike={...listings[1],url:"https://shop.example.com.evil.test/b"};
  assert.equal(decorateRetailerListings([lookalike],[activeProgram])[0].outboundUrl,undefined);
  assert.equal(affiliateConfigurationAudit("[]").state,"not configured");
  assert.equal(affiliateConfigurationAudit("{not-json").state,"invalid");
  assert.deepEqual(affiliateConfigurationAudit(JSON.stringify([activeProgram])).programs[0].issues,[]);
});

test("availability interface keeps paid-link disclosure visible and marks compensated links",async()=>{
  const component=await readFile(new URL("../components/wishlist-availability-board.tsx",import.meta.url),"utf8");
  assert.match(component,/Compensation does not change|compensation/i);
  assert.match(component,/noreferrer noopener sponsored/);
  assert.match(component,/adults 21\+ only/i);
  assert.match(component,/Direct retailer link · Hojavía receives no configured compensation/);
});

test("commercial standard preserves reporting privacy, rollback, and the Fox prohibition",async()=>{
  const policy=await readFile(new URL("../../corporate-docs/AFFILIATE_AND_RETAILER_MONETIZATION_STANDARD.md",import.meta.url),"utf8");
  assert.match(policy,/Commercial\s+performance must never feed organic\s+ranking or recommendation models/i);
  assert.match(policy,/Do not ingest customer names, emails, addresses, order contents/i);
  assert.match(policy,/Rollback removes affiliate parameters without breaking the original retailer\s+links/i);
  assert.match(policy,/no outreach,\s+tracking link, test, trial, campaign, configuration, or activation/i);
});

test("founder dashboard is read-only and never exposes affiliate parameter values",async()=>{
  const page=await readFile(new URL("../app/affiliate-readiness/page.tsx",import.meta.url),"utf8");
  assert.match(page,/Technical readiness is not launch authorization/i);
  assert.match(page,/Affiliate credentials and parameter values are intentionally never displayed/i);
  assert.match(page,/Fox status/);
  assert.doesNotMatch(page,/queryValue|queryParameter/);
});
