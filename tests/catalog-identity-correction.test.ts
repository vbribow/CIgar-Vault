import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("changing an exact cigar identity clears a stale catalog match", () => {
  const fields = readFileSync(new URL("../components/catalog-fields.tsx", import.meta.url), "utf8");
  const manager = readFileSync(new URL("../components/inventory-manager.tsx", import.meta.url), "utf8");
  assert.match(fields, /name="catalogId" type="hidden" value=\{match\?\.catalogId \|\| ""\}/);
  assert.match(manager, /clearableFields = new Set\(\["catalogId"/);
});
