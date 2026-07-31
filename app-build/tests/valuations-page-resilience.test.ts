import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/valuations/page.tsx", import.meta.url),
  "utf8",
);

test("valuation totals are never calculated from partial data", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /modeResult\.status !== "fulfilled"/);
  assert.match(page, /inventoryResult\.status !== "fulfilled"/);
  assert.match(page, /valuationsResult\.status !== "fulfilled"/);
  assert.match(page, /No portfolio total, coverage percentage, or missing\s+value has been inferred from partial data/);
  assert.doesNotMatch(page, /Promise\.all\(\[\s*loadInventory/);
});
