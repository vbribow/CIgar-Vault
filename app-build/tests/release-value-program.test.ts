import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { betaValueJourney } from "../lib/launch-readiness";

const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("one release command gates typecheck, complete tests, navigation, performance, and build",()=>{
  const packageSource=JSON.parse(read("package.json")) as {scripts:Record<string,string>};
  const command=packageSource.scripts["verify:release"];
  assert.match(command,/tsc --noEmit/);
  assert.match(command,/tsx --test tests\/\*\.test\.ts/);
  assert.match(command,/scripts\/build-app\.mjs/);
  const build=read("scripts/build-app.mjs");
  assert.match(build,/audit-internal-links\.mjs/);
  assert.match(build,/audit-performance-budget\.mjs/);
});

test("beta value acceptance covers the five collector tasks without claiming a synthetic pass",()=>{
  assert.deepEqual(betaValueJourney.map(item=>item.id),["photo-intake","correct-details","log-smoke","find-entry","learn-and-decide"]);
  const page=read("app/launch-readiness/page.tsx");
  assert.match(page,/Five tasks prove whether Hojavía is genuinely useful/);
  assert.match(page,/hesitation, confusion, and recovery/);
  assert.match(page,/A task remains NOT RUN until a real collector completes it/);
  assert.match(page,/href=\{item\.route\}/);
  for(const item of betaValueJourney)assert.match(item.route,/^\//);
});

test("the protected journeys retain exact-save and collector-data safeguards",()=>{
  const inventory=read("components/inventory-manager.tsx");
  const smoke=read("components/records-manager.tsx");
  const collections=read("lib/collection-dashboard.ts");
  const knowledge=read("app/api/catalog-discovery/run/route.ts");
  assert.match(inventory,/window\.location\.assign\(`\/inventory\/\$\{encodeURIComponent\(savedId\)\}\?saved=inventory`\)/);
  assert.match(inventory,/Edit all details/);
  assert.match(smoke,/fetchWithConfirmationRetry/);
  assert.match(smoke,/smokeMutation\.complete/);
  assert.match(collections,/excludedAssignedLots/);
  assert.match(knowledge,/queueCigarKnowledgeProposals/);
  assert.match(knowledge,/never copy article prose/i);
});
