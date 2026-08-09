import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("Discover provides one clear catalog-first cigar research journey",()=>{
  const page=read("app/discover/page.tsx"),component=read("components/research-any-cigar.tsx");
  assert.match(page,/<ResearchAnyCigar catalog=\{catalog\}/);
  assert.match(component,/Research any cigar/);
  assert.match(component,/Search Hojavía first/);
  assert.match(component,/No live research credits were used/);
  assert.match(component,/Research live sources and retailer evidence · uses credits/);
  assert.match(component,/Live research awaiting billing activation/);
  assert.match(component,/submissionId:createClientUuid\(\)/);
});

test("live research requires exact cigar identity and keeps unknown facts unknown",()=>{
  const route=read("app/api/cigar-research/route.ts");
  assert.match(route,/Do not substitute a nearby vitola/);
  assert.match(route,/Use empty strings for facts that remain unknown/);
  assert.match(route,/listingMatchesExactIdentity/);
  assert.match(route,/Sign in before researching a cigar/);
  assert.match(route,/cigarResearchServiceStatus/);
  assert.match(route,/readCachedCigarResearch/);
  assert.match(route,/beginCigarResearch/);
  assert.match(route,/writeCachedCigarResearch/);
  assert.match(route,/Opus6 and Opus 6/);
});

test("research results connect to the useful next actions without silently saving inventory",()=>{
  const component=read("components/research-any-cigar.tsx");
  const records=read("app/records/page.tsx");
  const inventory=read("app/inventory/page.tsx");
  assert.match(component,/Ask Cigar Somm/);
  assert.match(component,/Log a smoke/);
  assert.match(component,/Add to Vault/);
  assert.match(component,/Save to wishlist/);
  assert.match(records,/initialManualName=\{cigarName\}/);
  assert.match(inventory,/initialIntakeQuery=\{filters\.cigarName\}/);
});

test("retailer results remain non-transactional and never substitute another cigar",()=>{
  const component=read("components/research-any-cigar.tsx");
  assert.match(component,/observed during research; verify independently/);
  assert.match(component,/does not open tobacco purchase pages or use affiliate tracking/);
  assert.doesNotMatch(component,/href=\{listing\.outboundUrl/);
  assert.match(component,/No exact current retailer listing was confirmed/);
  assert.match(component,/will not substitute a nearby cigar/);
});
