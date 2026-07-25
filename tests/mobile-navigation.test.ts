import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navigation = readFileSync(new URL("../components/app-navigation.tsx", import.meta.url), "utf8");

test("community navigation uses the Collectors’ Lounge identity", () => {
  assert.match(navigation, />Collectors’ Lounge<\/Link>/);
  assert.match(navigation, /aria-label="Collectors’ Lounge"/);
  assert.match(navigation, /<small>Lounge<\/small>/);
});
const inventory = readFileSync(new URL("../app/inventory/page.tsx", import.meta.url), "utf8");

test("collections remain directly reachable through the mobile Vault and inventory", () => {
  assert.match(navigation, /matches\(pathname,"\/collections"\)/);
  assert.match(navigation, /<small>Vault<\/small>/);
  assert.match(inventory, /Valuable Collections/);
});

test("mobile navigation keeps Cigar Somm prominent",()=>{
  for(const label of["Home","Discover","Lounge","Document","Vault","Somm"])assert.match(navigation,new RegExp(`<small>${label}<\\/small>`));
  assert.match(navigation,/gridTemplateColumns:"repeat\(6, minmax\(0, 1fr\)\)"/);
  assert.match(navigation, />Cigar Somm<\/Link>/);
});
