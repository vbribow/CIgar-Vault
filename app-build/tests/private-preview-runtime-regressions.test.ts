import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the locally validated Vault bundle declares its cigar-only working set", () => {
  const inventory = source("components/inventory-manager.tsx");
  const declaration = inventory.indexOf("const scopedItems = useMemo");
  const firstRenderedUse = inventory.indexOf("{filtered.length} of {scopedItems.length}");
  assert.ok(declaration >= 0, "scopedItems must be declared");
  assert.ok(firstRenderedUse > declaration, "scopedItems must be declared before its rendered use");
});

test("the locally validated records bundle declares the selected valuation source", () => {
  const records = source("components/records-manager.tsx");
  const declaration = records.indexOf("const [valuationSource, setValuationSource]");
  const firstRenderedUse = records.indexOf("{valuationSource &&");
  assert.ok(declaration >= 0, "valuationSource must be declared");
  assert.ok(firstRenderedUse > declaration, "valuationSource must be declared before its rendered use");
});
