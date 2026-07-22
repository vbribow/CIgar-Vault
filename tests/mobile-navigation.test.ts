import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navigation = readFileSync(new URL("../components/app-navigation.tsx", import.meta.url), "utf8");
const inventory = readFileSync(new URL("../app/inventory/page.tsx", import.meta.url), "utf8");

test("collections are directly reachable from mobile navigation and inventory", () => {
  assert.match(navigation, /href="\/collections"/);
  assert.match(navigation, /<small>Collections<\/small>/);
  assert.match(inventory, /View collections/);
});
