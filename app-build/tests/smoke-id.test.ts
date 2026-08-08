import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createSmokeId } from "../lib/smoke-id";
import { findNearDuplicateSmoke, smokeEntryOrder } from "../lib/smoke-journal";
import { compareSmokeInventory, matchesSmokeInventory } from "../components/records-manager";

test("server smoke IDs are collision resistant across simultaneous submissions",()=>{
  const ids = new Set(Array.from({length:1000},()=>createSmokeId()));
  assert.equal(ids.size,1000);
  for(const id of ids) assert.match(id,/^SMK-[A-F0-9]{20}$/);
});

test("a retried submission receives the same canonical ID",()=>{
  const submissionId="11111111-1111-4111-8111-111111111111";
  assert.equal(createSmokeId(submissionId),createSmokeId(submissionId));
  assert.notEqual(createSmokeId(submissionId),createSmokeId("22222222-2222-4222-8222-222222222222"));
});

test("legacy IDs remain valid and friendly journal order is separate",()=>{
  const records=[
    {smokeId:"LEGACY-7",dateSmoked:"2026-07-20"},
    {smokeId:createSmokeId("33333333-3333-4333-8333-333333333333"),dateSmoked:"2026-07-21"},
  ];
  assert.equal(smokeEntryOrder(records,"LEGACY-7"),1);
  assert.equal(smokeEntryOrder(records,records[1].smokeId),2);
});

test("Log a Smoke hides Smoke ID and preserves INV-0053 preselection",()=>{
  const manager=readFileSync(new URL("../components/records-manager.tsx",import.meta.url),"utf8");
  const page=readFileSync(new URL("../app/records/page.tsx",import.meta.url),"utf8");
  assert.doesNotMatch(manager,/name="smokeId"/);
  assert.match(manager,/useState\(selectedInventoryId \|\| ""\)/);
  assert.match(page,/selectedInventoryId=\{selectedItem\?\.inventoryId\}/);
  assert.match(page,/No different cigar was selected/);
});

test("Log a Smoke welcomes cigars outside inventory and is globally accessible",()=>{
  const manager=readFileSync(new URL("../components/records-manager.tsx",import.meta.url),"utf8");
  const navigation=readFileSync(new URL("../components/app-navigation.tsx",import.meta.url),"utf8");
  assert.match(manager,/Do not remove from my Vault/);
  assert.match(manager,/Remove from my Vault/);
  assert.match(manager,/gift, lounge cigar, or separate purchase/);
  assert.doesNotMatch(manager,/<option value="MANUAL">/);
  assert.match(manager,/no Vault record and no quantity change/);
  assert.match(navigation,/Log a Smoke/);
  assert.match(navigation,/href="\/records#log-smoke"/);
  assert.match(navigation,/<small>Log Smoke<\/small>/);
});

test("Log a Smoke supports typed Vault search and a full inventory picker",()=>{
  const manager=readFileSync(new URL("../components/records-manager.tsx",import.meta.url),"utf8");
  assert.match(manager,/id="smoke-inventory-search"/);
  assert.match(manager,/Type brand, line, vitola, or inventory ID/);
  assert.match(manager,/smokeInventoryMatches\.map/);
  assert.match(manager,/Do not remove from my Vault/);
  const tauros={inventoryId:"INV-PD-C10",brand:"Arturo Fuente",line:"OpusX Heaven and Earth",vitola:"Tauros the Bull Maduro",currentQty:10,status:"Preserve",priority:"High"} as const;
  assert.equal(matchesSmokeInventory(tauros,"Fuente Taurus maduro"),true);
  assert.equal(matchesSmokeInventory(tauros,"opus x heaven earth"),true);
  assert.equal(matchesSmokeInventory(tauros,"Padron Churchill"),false);
});

test("Log a Smoke groups cigar families while preserving exact physical lots",()=>{
  const inventory=[
    {inventoryId:"INV-0069",brand:"Arturo Fuente",line:"OpusX Heaven & Earth",vitola:"Scorpio Maduro",currentQty:9},
    {inventoryId:"INV-0001",brand:"Arturo Fuente",line:"Don Carlos",vitola:"Eye of the Shark",currentQty:1},
    {inventoryId:"INV-PD-C9A",brand:"Arturo Fuente",line:"OpusX Heaven and Earth",vitola:"Scorpio Maduro",currentQty:10},
    {inventoryId:"INV-0029",brand:"Arturo Fuente",line:"OpusX Heaven & Earth",vitola:"Tauros the Bull Maduro",currentQty:0},
    {inventoryId:"INV-0040",brand:"Padrón",line:"1964 Anniversary",vitola:"Principe",currentQty:4},
  ];
  const sorted=[...inventory].sort(compareSmokeInventory);
  assert.deepEqual(sorted.map(item=>item.inventoryId),["INV-0001","INV-0069","INV-PD-C9A","INV-0029","INV-0040"]);
  assert.equal(sorted.filter(item=>matchesSmokeInventory(item,"heaven earth")).length,3);
  assert.equal(new Set(sorted.map(item=>item.inventoryId)).size,inventory.length,"sorting must not collapse separate lots");
});

test("save route generates IDs server-side and uses insert-only reservation",()=>{
  const route=readFileSync(new URL("../app/api/smoking-log/route.ts",import.meta.url),"utf8");
  assert.match(route,/SmokingLogCreateSchema\.parse/);
  assert.match(route,/createSmokeId\(submissionId\)/);
  assert.match(route,/createOwnedRecord\("smokes",item\.smokeId,item\)/);
  assert.equal(route.includes('saveOwnedRecord("smokes"'),false);
});

test("identical second smoke is blocked unless a new entry was explicitly confirmed",()=>{
  const existing={smokeId:"SMK-OLD",inventoryId:"INV-0053",dateSmoked:"2026-07-27",overall:91,strength:"Medium",flavor:"Cedar, Coffee",tastingNotes:"Balanced",buyAgain:true};
  assert.equal(findNearDuplicateSmoke([existing],{...existing,smokeId:"SMK-NEW"})?.smokeId,"SMK-OLD");
  assert.equal(findNearDuplicateSmoke([existing],{...existing,smokeId:"SMK-NEW",overall:92}),undefined);
  assert.equal(findNearDuplicateSmoke([{...existing,quantitySmoked:1}],{...existing,smokeId:"SMK-MULTI",quantitySmoked:2}),undefined);
  const route=readFileSync(new URL("../app/api/smoking-log/route.ts",import.meta.url),"utf8");
  assert.match(route,/!newEntryConfirmed/);
  assert.match(route,/status: 409/);
});

test("completed smoke form requires Log another before a second creation",()=>{
  const manager=readFileSync(new URL("../components/records-manager.tsx",import.meta.url),"utf8");
  assert.match(manager,/if \(!mutation\.begin\(\)\) return/);
  assert.match(manager,/disabled=\{smokeMutation\.pending \|\| smokeMutation\.complete\}/);
  assert.match(manager,/>Log another</);
  assert.match(manager,/aria-busy=\{smokeMutation\.pending\}/);
  assert.match(manager,/aria-live="polite"/);
});

test("inventory decrement runs only after the insert-only smoke reservation wins",()=>{
  const route=readFileSync(new URL("../app/api/smoking-log/route.ts",import.meta.url),"utf8");
  const reserve=route.indexOf('createOwnedRecord("smokes"');
  const created=route.indexOf('owned === "created"');
  const decrement=route.indexOf('consumeInventory(inventory,item.quantitySmoked ?? 1)');
  assert.ok(reserve>=0&&created>reserve&&decrement>created);
  assert.match(route,/owned === "exists"[\s\S]*retry: true/);
});

test("Log a Smoke records and explains the exact Vault quantity deduction",()=>{
  const manager=readFileSync(new URL("../components/records-manager.tsx",import.meta.url),"utf8");
  assert.match(manager,/name="quantitySmoked"/);
  assert.match(manager,/max=\{selectedSmokeInventory\.currentQty\}/);
  assert.match(manager,/original quantity stays unchanged/);
  assert.match(manager,/smokeQuantityBlocked/);
  assert.match(manager,/Correct this exact record/);
});
