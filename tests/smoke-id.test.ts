import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createSmokeId } from "../lib/smoke-id";
import { smokeEntryOrder } from "../lib/smoke-journal";

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
  assert.match(page,/selectedInventoryId=\{inventoryId\}/);
});

test("save route generates IDs server-side and uses insert-only reservation",()=>{
  const route=readFileSync(new URL("../app/api/smoking-log/route.ts",import.meta.url),"utf8");
  assert.match(route,/SmokingLogCreateSchema\.parse/);
  assert.match(route,/createSmokeId\(submissionId\)/);
  assert.match(route,/createOwnedRecord\("smokes",item\.smokeId,item\)/);
  assert.equal(route.includes('saveOwnedRecord("smokes"'),false);
});
