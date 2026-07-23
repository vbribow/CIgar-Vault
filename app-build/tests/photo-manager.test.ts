import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../components/photo-manager.tsx", import.meta.url), "utf8");

test("photo upload always releases its mobile loading state", () => {
  assert.match(source, /new AbortController\(\)/);
  assert.match(source, /finally\s*\{/);
  assert.match(source, /setUploading\(false\)/);
  assert.match(source, /aria-live="polite"/);
});

test("an attached photo can update the surrounding inventory editor", () => {
  assert.match(source, /onAttached\?: \(item: InventoryItem\) => void/);
  assert.match(source, /onAttached\?\.\(result\.data\)/);
});
