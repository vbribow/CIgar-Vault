import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const createRoute = readFileSync(new URL("../app/api/inventory/route.ts", import.meta.url), "utf8");
const updateRoute = readFileSync(new URL("../app/api/inventory/[inventoryId]/route.ts", import.meta.url), "utf8");

test("new inventory can use only a registered private storage location", () => {
  assert.match(createRoute, /loadHumidors\(\)/);
  assert.match(createRoute, /humidor\.humidorId === draft\.storageLocationId/);
  assert.match(createRoute, /Choose one of your registered humidors or storage locations/);
});

test("legacy storage remains untouched while changed assignments require a registered location", () => {
  assert.match(updateRoute, /item\.storageLocationId !== existing\.storageLocationId/);
  assert.match(updateRoute, /humidor\.humidorId === item\.storageLocationId/);
  assert.match(updateRoute, /status: 422/);
});
