import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../components/inventory-record-tools.tsx", import.meta.url), "utf8");

test("individual records expose correction and photo tools with server refresh", () => {
  assert.match(source, /InventoryCorrectionAssistant/);
  assert.match(source, /PhotoManager/);
  assert.match(source, /router\.refresh\(\)/);
});
