import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/inventory/page.tsx", "utf8");

test("inventory page protects ownership truth when core account data cannot load", () => {
  assert.match(page, /Inventory records protected/);
  assert.match(page, /Nothing has been classified as missing or deleted/);
  assert.match(page, /if \(!modeResult\.ok \|\| !inventoryResult\.ok\)/);
});

test("inventory page isolates optional supporting services", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.doesNotMatch(page, /loadCatalog|loadRatings/);
  assert.match(page, /catalog=\{\[\]\} ratings=\{\[\]\}/);
  assert.match(page, /Collection links temporarily unavailable/);
  assert.match(page, /Records unavailable →/);
  assert.doesNotMatch(page, /const items = await loadInventory\(\)/);
});
