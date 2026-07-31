import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/collections/[collectionId]/page.tsx", import.meta.url),
  "utf8",
);

test("collection detail does not turn a dependency failure into a missing collection", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /const coreReady/);
  assert.match(page, /has not been classified as missing or deleted/);
  assert.match(page, /if \(!coreReady\)/);
});

test("collection history remains available when only valuations fail", () => {
  assert.match(page, /const valuationReady/);
  assert.match(page, /Valuation evidence is hidden rather than presented as zero/);
  assert.match(page, /valuationsResult\.status === "fulfilled" \? valuationsResult\.value : \[\]/);
});
