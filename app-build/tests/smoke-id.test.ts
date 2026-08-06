import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createSmokeId } from "../lib/smoke-id";
import { findNearDuplicateSmoke, smokeEntryOrder } from "../lib/smoke-journal";

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
  const smokePicker=manager.slice(manager.indexOf('Inventory lot or another cigar *'),manager.indexOf('{smokeSource === "MANUAL" && <label'));
  const manual=smokePicker.indexOf('<option value="MANUAL">Another smoke — not in my Vault</option>');
  const inventory=smokePicker.indexOf('{inventory.map(item => <option');
  assert.ok(manual>=0&&inventory>manual,"manual smoke choice should precede inventory lots");
  assert.match(manager,/no Vault record and no quantity change/);
  assert.match(navigation,/Log a Smoke/);
  assert.match(navigation,/href="\/records#log-smoke"/);
  assert.match(navigation,/<small>Log Smoke<\/small>/);
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
  const decrement=route.indexOf('consumeOneInventory(inventory)');
  assert.ok(reserve>=0&&created>reserve&&decrement>created);
  assert.match(route,/owned === "exists"[\s\S]*retry: true/);
});
