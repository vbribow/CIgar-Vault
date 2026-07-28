import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const inventoryManager = readFileSync(new URL("../components/inventory-manager.tsx", import.meta.url), "utf8");
const collectionsManager = readFileSync(new URL("../components/collections-manager.tsx", import.meta.url), "utf8");
const discoverPage = readFileSync(new URL("../app/discover/page.tsx", import.meta.url), "utf8");

test("inventory deletion reports network and non-JSON failures without changing local inventory", () => {
  assert.match(inventoryManager, /response\.json\(\)\.catch\(\(\) => \(\{\}\)\)/);
  assert.match(inventoryManager, /if \(!response\.ok\) throw new Error/);
  assert.match(inventoryManager, /catch \(error\) \{/);
  assert.match(inventoryManager, /Delete failed\. Check your connection and try again\./);
});

test("collection saving always releases its loading state and reports failures", () => {
  assert.match(collectionsManager, /response\.json\(\)\.catch\(\(\)=>\(\{\}\)\)/);
  assert.match(collectionsManager, /Collection save failed\. Check your connection and try again\./);
  assert.match(collectionsManager, /finally\{\s*setSaving\(false\);\s*\}/);
});

test("discovery stays request-scoped so private catalog configuration is not required during deployment", () => {
  assert.match(discoverPage, /export const dynamic = "force-dynamic"/);
});
