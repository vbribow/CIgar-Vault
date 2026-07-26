import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/collection-health/page.tsx", import.meta.url),
  "utf8",
);

test("Collection Health fails closed when ownership data is incomplete", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /status!=="fulfilled"/);
  assert.match(page, /No lot has been classified as incomplete, mismatched, or missing/);
  assert.doesNotMatch(page, /Promise\.all\(\[loadInventory/);
});
