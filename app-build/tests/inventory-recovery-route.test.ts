import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(
  new URL("../app/api/inventory-integrity/restore/route.ts", import.meta.url),
  "utf8",
);

test("inventory recovery is insert-only and records its audit atomically", () => {
  assert.match(route, /createOwnedRecords\(\[/);
  assert.match(route, /kind: "inventory"/);
  assert.match(route, /kind: "integrity"/);
  assert.match(route, /if \(!created\)/);
  assert.doesNotMatch(route, /importOwnedRecords/);
  assert.doesNotMatch(route, /saveOwnedRecord/);
});
