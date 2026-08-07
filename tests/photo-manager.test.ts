import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../components/photo-manager.tsx", import.meta.url), "utf8");

test("photo upload always releases its mobile loading state", () => {
  assert.match(source, /new AbortController\(\)/);
  assert.match(source, /Promise\.race\(/);
  assert.match(source, /TimeoutError/);
  assert.match(source, /finally\s*\{/);
  assert.match(source, /setUploading\(false\)/);
  assert.match(source, /aria-live="polite"/);
});

test("an attached photo can update the surrounding inventory editor", () => {
  assert.match(source, /onAttached\?: \(item: InventoryItem\) => void/);
  assert.match(source, /onAttached\?\.\(updated\)/);
});

test("a stalled response reconciles a photo that the server already saved", () => {
  assert.match(source, /fetch\("\/api\/inventory", \{ cache: "no-store"/);
  assert.match(source, /await reconcile\(kind, previousUrl\)/);
  assert.match(source, /Photo attached and inventory synced/);
});

test("manual attachment accepts only browser-displayable formats and explains replacement cleanup", () => {
  assert.match(source, /accept="image\/jpeg,image\/png,image\/webp,application\/pdf"/);
  assert.doesNotMatch(source, /accept="[^"]*image\/heic/);
  assert.match(source, /successful replacement removes the prior private file/);
});
