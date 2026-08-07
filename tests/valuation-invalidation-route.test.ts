import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route=readFileSync(
  new URL("../app/api/valuations/[valuationId]/route.ts",import.meta.url),
  "utf8",
);

test("repeating an invalidation repairs a stale matching inventory value",()=>{
  assert.doesNotMatch(route,/if\(valuation\.invalidatedAt\)return/);
  assert.match(route,/valuation\.invalidatedAt\?\?new Date\(\)\.toISOString\(\)/);
  assert.match(route,/inventory\.retailValue===valuation\.replacementValue/);
  assert.match(route,/saveOwnedRecordsAtomically\(records\)/);
});
