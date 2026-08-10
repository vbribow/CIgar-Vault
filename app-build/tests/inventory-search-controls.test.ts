import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manager = readFileSync(new URL("../components/inventory-manager.tsx", import.meta.url), "utf8");
const intake = readFileSync(new URL("../components/photo-inventory-intake.tsx", import.meta.url), "utf8");

test("existing inventory has explicit search and clear actions", () => {
  assert.match(manager, /role="search"/);
  assert.match(manager, />Search Vault<\/button>/);
  assert.match(manager, />Clear search and filters<\/button>/);
  assert.match(manager, /setQuery\(queryInput\.trim\(\)\)/);
  assert.match(manager, /setStatus\("all"\)/);
  assert.match(manager, /setMissing\("all"\)/);
  assert.match(manager, /setStorage\("all"\)/);
});

test("enter another cigar resets the completed intake workflow", () => {
  assert.match(intake, />Enter another cigar<\/button>/);
  assert.match(intake, /function nextAsset\(\)/);
  assert.match(intake, /setQuery\(""\)/);
  assert.match(intake, /setPhotos/);
  assert.match(intake, /setStage\("identify"\)/);
});
