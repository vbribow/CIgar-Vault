import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manager = readFileSync(new URL("../components/inventory-manager.tsx", import.meta.url), "utf8");
const intake = readFileSync(new URL("../components/photo-inventory-intake.tsx", import.meta.url), "utf8");

test("existing inventory has explicit search and clear actions", () => {
  assert.match(manager, /role="search"/);
  assert.match(manager, /type="submit" className="button"/);
  assert.match(manager, /queryInput\.trim\(\) \? "Search Vault" : "Browse all lots"/);
  assert.doesNotMatch(manager, /disabled=\{!queryInput\.trim\(\)\}/);
  assert.match(manager, />Clear search and filters<\/button>/);
  assert.match(manager, /const nextQuery = queryInput\.trim\(\)/);
  assert.match(manager, /setQuery\(nextQuery\)/);
  assert.match(manager, /setStatus\("all"\)/);
  assert.match(manager, /setMissing\("all"\)/);
  assert.match(manager, /setStorage\("all"\)/);
  assert.match(manager, /setSearchFeedback\(\{ message:/);
  assert.match(manager, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(manager, /\.inventoryMobileList,\.inventoryDesktopTable/);
  assert.match(manager, /target\?\.focus\(\{ preventScroll: true \}\)/);
});

test("enter another cigar resets the completed intake workflow", () => {
  assert.match(intake, />Enter another cigar<\/button>/);
  assert.match(intake, /function nextAsset\(\)/);
  assert.match(intake, /setQuery\(""\)/);
  assert.match(intake, /setPhotos/);
  assert.match(intake, /setStage\("identify"\)/);
});
