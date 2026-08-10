import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("deleting an inventory record returns through a full Vault navigation", () => {
  const actions = readFileSync(new URL("../components/inventory-record-actions.tsx", import.meta.url), "utf8");
  assert.match(actions, /window\.location\.assign\("\/inventory#inventory-records"\)/);
  assert.doesNotMatch(actions, /router\.push\("\/inventory#inventory-records"\)/);
});
