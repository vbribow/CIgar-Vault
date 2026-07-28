import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const files=[
  "../components/retail-pricing-controls.tsx",
  "../components/valuation-research-panel.tsx",
  "../components/valuation-completion-panel.tsx",
];

test("collector valuation workflows use server-owned IDs and retry-safe submission IDs",()=>{
  for(const file of files){
    const source=readFileSync(new URL(file,import.meta.url),"utf8");
    assert.doesNotMatch(source,/VAL-(?:MANUAL|WEB|COMPLETE|REVIEW)-/);
    assert.match(source,/submissionId/);
  }
});
