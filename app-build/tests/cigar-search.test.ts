import assert from "node:assert/strict";
import test from "node:test";
import type { InventoryItem } from "../lib/types";
import { matchesInventorySearch } from "../lib/cigar-search";

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
