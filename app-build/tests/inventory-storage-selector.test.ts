import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page=readFileSync(new URL("../app/inventory/page.tsx",import.meta.url),"utf8");
const manager=readFileSync(new URL("../components/inventory-manager.tsx",import.meta.url),"utf8");

test("inventory editing saves registered humidor IDs while showing friendly names",()=>{
  assert.match(page,/humidors=\{humidors\}/);
  assert.match(manager,/select name="storageLocationId"/);
  assert.match(manager,/value=\{humidor\.humidorId\}>\{humidor\.name\}/);
  assert.match(manager,/humidor\.name\.trim\(\)\.toLowerCase\(\) === formItem\.storageLocationId/);
  assert.match(manager,/Choose one of your registered humidors/);
});

test("bulk storage changes use the same registered-humidor selector",()=>{
  assert.match(manager,/select name="bulkStorage"/);
  assert.doesNotMatch(manager,/input name="bulkStorage"/);
});
