import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/value-history/page.tsx", import.meta.url),
  "utf8",
);

test("portfolio history is never calculated from partial financial data", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /inventoryResult\.status !== "fulfilled"/);
  assert.match(page, /valuationsResult\.status !== "fulfilled"/);
  assert.match(page, /No portfolio value, historical\s+movement, or coverage percentage has been inferred from partial\s+data/);
  assert.doesNotMatch(page, /Promise\.all\(\[loadInventory/);
});
