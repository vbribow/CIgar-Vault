import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/collection-health/page.tsx", import.meta.url),
  "utf8",
);

test("inventory audit fails closed when ownership data is incomplete", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /status\s*!==\s*"fulfilled"/);
  assert.match(page, /No lot has been classified as incomplete, mismatched, or missing/);
  assert.doesNotMatch(page, /Promise\.all\(\[loadInventory/);
});

test("inventory audit recognizes either provenance notes or a linked document", () => {
  assert.match(page, /hasInventoryProvenance\(item\)/);
});

test("inventory audit and score share the physical quantity definition", () => {
  assert.match(page, /!hasPhysicalQuantityBreakdown\(item\)/);
  assert.match(page, /inventoryCompleteness\(item\)/);
});
