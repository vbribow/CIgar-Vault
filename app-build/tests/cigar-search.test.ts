import assert from "node:assert/strict";
import test from "node:test";
import type { InventoryItem } from "../lib/types";
import { matchesInventorySearch, matchesInventorySearchExactWords, matchesInventorySearchForgiving, preferActionableInventoryMatches } from "../lib/cigar-search";

const toyMaker: InventoryItem = {
  inventoryId: "INV-0020",
  brand: "Arturo Fuente",
  line: "Toy Maker Series",
  vitola: "BBMF Natural",
  currentQty: 1,
};

test("common OpusX Toy Maker wording finds the existing BBMF record", () => {
  assert.equal(matchesInventorySearch(toyMaker,"ToyMaker BBMF"),true);
});

test("BMF and BBMF remain distinct while common spacing and partial wording work", () => {
  const bmf = { ...toyMaker, inventoryId: "INV-BMF", line: "ToyMaker BMF Natural", vitola: "BMF Presentation Chest — Box 1" };
  assert.equal(matchesInventorySearch(bmf,"opus x toy make bmf"),true);
  assert.equal(matchesInventorySearch(toyMaker,"opus x toy make bmf"),false);
  assert.equal(matchesInventorySearch(bmf,"opus x toy make bbmf"),false);
});

test("search convenience aliases do not match a nearby Toy Maker cigar", () => {
  const granOpus = { ...toyMaker, inventoryId: "INV-0021", vitola: "Gran Opus" };
  assert.equal(matchesInventorySearch(granOpus,"opus x toy make bmf"),false);
});

test("smoke search finds Casa Cuba despite one mistaken family term", () => {
  const casaCuba: InventoryItem = { inventoryId: "INV-CASA-CUBA", brand: "Arturo Fuente", line: "Casa Cuba", vitola: "Divine Inspiration", currentQty: 30 };
  assert.equal(matchesInventorySearch(casaCuba, "opus x casa cuba"), false);
  assert.equal(matchesInventorySearchForgiving(casaCuba, "opus x casa cuba"), true);
  assert.equal(matchesInventorySearchForgiving(toyMaker, "opus x casa cuba"), false);
});

test("one-letter cigar names match exactly instead of expanding to every B word",()=>{
  const bigB:InventoryItem={inventoryId:"INV-BIG-B",brand:"Arturo Fuente",line:"OpusX Heaven and Earth",vitola:"Big B",currentQty:6};
  const bbmf:InventoryItem={...bigB,inventoryId:"INV-BBMF",vitola:"BBMF Natural"};
  assert.equal(matchesInventorySearchExactWords(bigB,"Opus X big B"),true);
  assert.equal(matchesInventorySearchExactWords(bbmf,"Opus X big B"),false);
  assert.equal(matchesInventorySearchExactWords(toyMaker,"Opus X big B"),false);
  assert.equal(matchesInventorySearchExactWords(bigB,"Opus X big"),true);
  assert.equal(matchesInventorySearchExactWords(bigB,"Opus X bi"),false);
});

test("smoke search prefers the owned collection lot over a stale quantity-less duplicate",()=>{
  const legacy:InventoryItem={inventoryId:"INV-0030",brand:"Arturo Fuente",line:"OpusX Heaven & Earth",vitola:"Big B"};
  const collection:InventoryItem={...legacy,inventoryId:"INV-FUENTE-PURPLE-DREAM-C02",line:"OpusX Heaven and Earth",currentQty:6,collectionId:"COLL-PURPLE-DREAM"};
  assert.deepEqual(preferActionableInventoryMatches([legacy,collection]).map(item=>item.inventoryId),[collection.inventoryId]);
  assert.deepEqual(preferActionableInventoryMatches([legacy]).map(item=>item.inventoryId),[legacy.inventoryId]);
});
