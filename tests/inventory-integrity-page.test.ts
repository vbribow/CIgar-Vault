import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/inventory-integrity/page.tsx", import.meta.url),
  "utf8",
);

test("the Integrity Center never interprets a failed dependency as missing inventory", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /No comparison was inferred from incomplete data/);
  assert.match(page, /no records\s+have been classified as missing/);
  assert.match(page, /comparisonReady \? reconcileInventory/);
});

test("signed-out access cannot be presented as an empty authoritative account", () => {
  assert.match(page, /will not interpret a signed-out account as\s+an empty collection/);
  assert.match(page, /comparisonReady \? `\$\{summary\.score\}%` : "—"/);
});
