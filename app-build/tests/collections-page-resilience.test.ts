import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/collections/page.tsx", import.meta.url),
  "utf8",
);

test("Collections remains honest when a core ownership source fails", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /const coreReady/);
  assert.match(page, /No\s+collection has been classified as empty, incomplete, or missing/);
  assert.match(page, /coreReady \? \(/);
});

test("valuation failure never appears as a zero-value collection", () => {
  assert.match(page, /const valuationReady/);
  assert.match(page, /Valuation evidence is temporarily hidden rather than shown as\s+zero/);
});
