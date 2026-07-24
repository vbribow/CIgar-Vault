import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navigation = readFileSync(new URL("../components/app-navigation.tsx", import.meta.url), "utf8");
const inventory = readFileSync(new URL("../app/inventory/page.tsx", import.meta.url), "utf8");

test("collections remain directly reachable through the mobile Vault and inventory", () => {
  assert.match(navigation, /matches\(pathname,"\/collections"\)/);
  assert.match(navigation, /<small>Vault<\/small>/);
  assert.match(inventory, /View collections/);
});

test("mobile navigation keeps Cigar Somm prominent",()=>{
  for(const label of["Home","Discover","Document","Vault","Somm"])assert.match(navigation,new RegExp(`<small>${label}<\\/small>`));
  assert.match(navigation, />Cigar Somm<\/Link>/);
});
