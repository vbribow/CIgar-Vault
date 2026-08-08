import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { SmokingLogEditSchema } from "../lib/records-model";

test("smoking-entry corrections accept a removed score and reject identity or quantity changes",()=>{
  assert.deepEqual(SmokingLogEditSchema.parse({dateSmoked:"2026-08-08",tastingNotes:"Corrected note",buyAgain:false}),{dateSmoked:"2026-08-08",tastingNotes:"Corrected note",buyAgain:false});
  assert.throws(()=>SmokingLogEditSchema.parse({dateSmoked:"2026-08-08",inventoryId:"INV-OTHER"}));
  assert.throws(()=>SmokingLogEditSchema.parse({dateSmoked:"2026-08-08",quantitySmoked:99}));
});

test("edit route preserves server-owned identity and Vault deduction with conflict protection",()=>{
  const route=readFileSync(new URL("../app/api/smoking-log/[smokeId]/route.ts",import.meta.url),"utf8");
  assert.match(route,/recordRevision\(owned\) !== expectedRevision/);
  assert.match(route,/smokeId:owned\.smokeId, inventoryId:owned\.inventoryId, cigarName:owned\.cigarName, quantitySmoked:owned\.quantitySmoked/);
  assert.match(route,/saveOwnedRecordIfUnchanged\("smokes", smokeId, updated, expectedRevision\)/);
  assert.match(route,/scoredForIdentity\?\?updated/);
  assert.doesNotMatch(route,/consumeInventory/);
});

test("Smartsheet corrections explicitly clear removed optional ratings",()=>{
  const source=readFileSync(new URL("../lib/smartsheet.ts",import.meta.url),"utf8");
  assert.match(source,/\["Overall 1–100",log\.overall\?\?null\]/);
  assert.match(source,/\["Tasting Notes",log\.tastingNotes\?\?null\]/);
});

test("journal exposes an Edit smoke action and an explicit No score correction",()=>{
  const journal=readFileSync(new URL("../components/smoke-journal-browser.tsx",import.meta.url),"utf8");
  const editor=readFileSync(new URL("../components/smoke-entry-editor.tsx",import.meta.url),"utf8");
  const records=readFileSync(new URL("../components/records-manager.tsx",import.meta.url),"utf8");
  assert.match(journal,/>Edit smoke</);
  assert.match(records,/Edit smoke →/);
  assert.match(editor,/>No score</);
  assert.match(editor,/quantity already removed from your Vault stay unchanged/);
  assert.match(editor,/"If-Match":recordRevision\(smoke\)/);
});
