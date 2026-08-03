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

test("an empty vault is not presented as zero percent or falsely complete", () => {
  assert.match(page, /const hasActiveInventory = activeItems\.length > 0/);
  assert.match(page, /There is no active inventory to review yet/);
  assert.match(page, /No completeness score is calculated until an active cigar is documented/);
  assert.match(page, /without treating undocumented information as complete/);
  assert.match(page, /!hasActiveInventory \? "No active lots"/);
});

test("inventory completion is exposed to assistive technology", () => {
  assert.match(page, /role="progressbar"/);
  assert.match(page, /aria-valuemin=\{0\}/);
  assert.match(page, /aria-valuemax=\{100\}/);
  assert.match(page, /aria-valuenow=\{average\}/);
  assert.match(page, /aria-valuenow=\{inventoryCompleteness\(item\)\}/);
});
