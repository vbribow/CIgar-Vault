import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manager = readFileSync(new URL("../components/records-manager.tsx", import.meta.url), "utf8");

test("valuation intake starts with the cigar and offers research or manual entry", () => {
  assert.match(manager, /Research this cigar/);
  assert.match(manager, /Enter manually/);
  assert.match(manager, /Review or update these fields/);
  assert.match(manager, /Nothing is saved until you approve the form/);
});

test("valuation research is explicit about credit use and never saves automatically", () => {
  assert.match(manager, /New research may use configured AI research credits/);
  assert.match(manager, /fetch\("\/api\/valuation-research"/);
  assert.match(manager, /Research complete\. Review every proposed field before saving/);
  assert.match(manager, /Save reviewed evidence/);
});

test("research proposals populate every evidence class without weakening sale proof", () => {
  for (const field of ["replacementValue", "marketEvidenceType", "askingPrice", "marketRangeLow", "marketRangeHigh", "marketValue", "lastSaleValue", "lastSaleDate", "lastSaleSourceUrl", "sourceUrl", "confidence"]) {
    assert.match(manager, new RegExp(`proposed\\?\\.${field}`));
  }
  assert.match(manager, /A source description alone never proves a completed sale/);
});
