import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { SmokingLogEditSchema } from "../lib/records-model";

test("smoking-entry corrections accept a removed score and structured outside-Vault identity but reject quantity changes",()=>{
  assert.deepEqual(SmokingLogEditSchema.parse({dateSmoked:"2026-08-08",tastingNotes:"Corrected note",buyAgain:false}),{dateSmoked:"2026-08-08",tastingNotes:"Corrected note",buyAgain:false});
  assert.throws(()=>SmokingLogEditSchema.parse({dateSmoked:"2026-08-08",inventoryId:"INV-OTHER"}));
  assert.throws(()=>SmokingLogEditSchema.parse({dateSmoked:"2026-08-08",quantitySmoked:99}));
  assert.equal(SmokingLogEditSchema.safeParse({dateSmoked:"2026-08-08",cigarName:"Casa Fuente Double Corona",outsideInventory:true,cigarBrand:"Arturo Fuente",cigarLine:"Casa Fuente",cigarVitola:"Double Corona"}).success,true);
});

test("edit route preserves server-owned identity and Vault deduction with conflict protection",()=>{
  const route=readFileSync(new URL("../app/api/smoking-log/[smokeId]/route.ts",import.meta.url),"utf8");
  assert.match(route,/recordRevision\(owned\) !== expectedRevision/);
  assert.match(route,/Vault-linked cigar identity cannot be changed from the smoking journal/);
  assert.match(route,/smokeId:owned\.smokeId, inventoryId:owned\.inventoryId, cigarName:owned\.cigarName/);
  assert.match(route,/quantitySmoked:owned\.quantitySmoked/);
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
  assert.match(editor,/Vault-linked identity and quantity remain protected/);
  assert.match(editor,/outside-Vault cigar/);
  assert.match(editor,/"If-Match":recordRevision\(smoke\)/);
});

test("new and edited smoke records share the Wood flavor option",()=>{
  const records=readFileSync(new URL("../components/records-manager.tsx",import.meta.url),"utf8");
  const editor=readFileSync(new URL("../components/smoke-entry-editor.tsx",import.meta.url),"utf8");
  assert.match(records,/flavorOptions = \[[^\]]*"Wood"/);
  assert.match(editor,/import \{ flavorOptions, strengthOptions \} from "@\/components\/records-manager"/);
});

test("journal leads with five newest entries and expands only on request",()=>{
  const journal=readFileSync(new URL("../components/smoke-journal-browser.tsx",import.meta.url),"utf8");
  const results=journal.indexOf('<section className="journalResults"');
  const metrics=journal.indexOf('<section className="journalMetrics"');
  assert.ok(results>=0&&metrics>results,"recent journal entries must precede summary metrics");
  assert.match(journal,/shown\.slice\(0,5\)/);
  assert.match(journal,/More · view all logged smokes/);
  assert.match(journal,/Most recent smokes/);
});

test("an unverified journal source is never presented as a truthful zero",()=>{
  const page=readFileSync(new URL("../app/smoke-journal/page.tsx",import.meta.url),"utf8");
  assert.match(page,/modeResult\.value === "supabase" \|\| smokesResult\.value\.length > 0/);
  assert.match(page,/Journal records protected/);
});
