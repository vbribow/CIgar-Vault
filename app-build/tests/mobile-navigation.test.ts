import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navigation = readFileSync(new URL("../components/app-navigation.tsx", import.meta.url), "utf8");

test("community navigation uses the Collectors’ Lounge identity", () => {
  assert.match(navigation, />Collectors’ Lounge<\/Link>/);
  assert.match(navigation, /\["\/community","Collectors’ Lounge"/);
});
const inventory = readFileSync(new URL("../app/inventory/page.tsx", import.meta.url), "utf8");

test("collections remain directly reachable through the mobile Vault and inventory", () => {
  assert.match(navigation, /matches\(pathname,"\/collections"\)/);
  assert.match(navigation, /<small>Vault<\/small>/);
  assert.match(inventory, /Valuable Collections/);
});

test("mobile navigation exposes a focused five-item bar and complete More sheet",()=>{
  for(const label of["Home","Discover","Document","Vault","More"])assert.match(navigation,new RegExp(`<small>${label}<\\/small>`));
  assert.match(navigation, /aria-haspopup="dialog"/);
  assert.match(navigation, /id="mobile-more-sheet"/);
  assert.match(navigation, /Search \{brand\.name\}/);
  assert.match(navigation, /mobileFeaturedLinks\.map/);
  assert.match(navigation, /moreLinks\.map/);
  assert.match(navigation, /\["\/cigar-somm","Cigar Somm"/);
});
