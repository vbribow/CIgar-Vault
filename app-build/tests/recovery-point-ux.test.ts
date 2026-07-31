import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("account recovery uses a confirmed client workflow instead of a blind download link", () => {
  const component = readFileSync(new URL("../components/create-recovery-point.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/account/page.tsx", import.meta.url), "utf8");
  assert.match(component, /fetch\("\/api\/account\/export"/);
  assert.match(component, /Recovery point recorded/);
  assert.match(component, /router\.refresh\(\)/);
  assert.match(component, /Importing a collection does not create a recovery point/);
  assert.match(page, /<CreateRecoveryPoint\s*\/>/);
  assert.doesNotMatch(page, /href="\/api\/account\/export"/);
});

test("the export response exposes only recovery confirmation metadata", () => {
  const route = readFileSync(new URL("../app/api/account/export/route.ts", import.meta.url), "utf8");
  assert.match(route, /"x-inventory-record-count"/);
  assert.match(route, /"x-recovery-point-created-at"/);
  assert.match(route, /"cache-control": "no-store"/);
});
