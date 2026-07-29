import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const inventorySource = await readFile(
  new URL("../lib/inventory.ts", import.meta.url),
  "utf8",
);
const inventoryApi = await readFile(
  new URL("../app/api/inventory/route.ts", import.meta.url),
  "utf8",
);

test("signed-in account inventory is resolved before mock data with no anonymous Smartsheet fallback", () => {
  const accountLookup = inventorySource.indexOf("loadAccountRecords");
  const mockLookup = inventorySource.indexOf('dataMode() === "mock"');

  assert.ok(accountLookup >= 0);
  assert.ok(mockLookup > accountLookup);
  assert.equal(inventorySource.includes('from "./smartsheet"'), false);
  assert.match(inventorySource, /accountInventory !== undefined/);
  assert.match(inventorySource, /return \[\];/);
});

test("inventory refresh reports account mode and disables intermediary caching", () => {
  assert.match(inventoryApi, /accountDataMode\(\)/);
  assert.match(inventoryApi, /private, no-store, max-age=0, must-revalidate/);
  assert.match(inventoryApi, /Pragma: "no-cache"/);
});
