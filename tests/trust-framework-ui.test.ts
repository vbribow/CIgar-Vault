import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { trustDefinition, trustFramework } from "../lib/trust-evidence";

test("Cedriva presents all five constitutional trust levels in order",()=>{
  assert.deepEqual(trustFramework.map(value=>value.kind),["Official","Verified Historical","Expert","Community","AI"]);
  assert.deepEqual(trustFramework.map(value=>value.level),[1,2,3,4,5]);
  assert.match(trustDefinition("AI").description,/AI-assisted/);
});

test("high-consequence collector surfaces display trust marks",()=>{
  const files=["../components/cigar-somm.tsx","../components/community-hub.tsx","../app/valuations/page.tsx"];
  for(const file of files)assert.match(readFileSync(new URL(file,import.meta.url),"utf8"),/TrustMark/);
});

test("the Trust Center explains evidence beyond the label",()=>{
  const page=readFileSync(new URL("../app/trust/page.tsx",import.meta.url),"utf8");
  assert.match(page,/A label is the beginning—not the proof/);
  assert.match(page,/Uncertainty belongs in the record/);
});
