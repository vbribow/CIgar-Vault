import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { mutationButtonText } from "../lib/mutation-state";

test("shared mutation labels communicate pending and completed states",()=>{
  const labels={idle:"Save",pending:"Saving…",success:"Saved"};
  assert.equal(mutationButtonText("idle",labels),"Save");
  assert.equal(mutationButtonText("pending",labels),"Saving…");
  assert.equal(mutationButtonText("success",labels),"Saved");
  assert.equal(mutationButtonText("error",labels),"Save");
  assert.equal(mutationButtonText("error",{...labels,error:"Retry save"}),"Retry save");
});

test("shared mutation guard uses an immediate ref lock rather than state alone",()=>{
  const hook=readFileSync(new URL("../components/use-mutation-guard.ts",import.meta.url),"utf8");
  assert.match(hook,/if \(locked\.current \|\| status === "success"\) return false/);
  assert.match(hook,/locked\.current = true/);
  assert.match(hook,/function reset\(\)/);
});

test("representative import and photo actions already expose pending text and disabled controls",()=>{
  const fileImport=readFileSync(new URL("../components/inventory-file-import.tsx",import.meta.url),"utf8");
  const photo=readFileSync(new URL("../components/photo-inventory-intake.tsx",import.meta.url),"utf8");
  assert.match(fileImport,/disabled=\{busy\}/);
  assert.match(fileImport,/Inspecting…/);
  assert.match(photo,/disabled=\{!photos\.length\|\|analyzing\}/);
  assert.match(photo,/Analyzing…/);
  assert.match(photo,/disabled=\{!pending\|\|approving\}/);
  assert.match(photo,/Adding to Vault…/);
});
