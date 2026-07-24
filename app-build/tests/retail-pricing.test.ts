import assert from "node:assert/strict";
import test from "node:test";
import { applyRetailValuationToInventory, existingRetailPriceForBasis, knownRetailPriceSuggestions, normalizeManualRetailPrice, retailBoxValue } from "../lib/retail-pricing";
import type { InventoryItem, Valuation } from "../lib/types";

const priced: InventoryItem = { inventoryId: "I-1", brand: "Padrón", line: "1964 Anniversary", vitola: "Exclusivo", vintage: 2024, currentQty: 5, sticksPerBox: 10 };
const matching: InventoryItem = { ...priced, inventoryId: "I-2", brand: "Padron" };
const valuation: Valuation = { valuationId: "V-1", inventoryId: "I-1", valuationDate: "2026-07-23", replacementValue: 32, source: "Authorized retailer", sourceUrl: "https://example.com/padron", confidence: "High" };

test("retail pricing calculates per-box value from a per-cigar price", () => {
  assert.equal(retailBoxValue({ retailValue: 32, sticksPerBox: 10 }), 320);
  assert.equal(retailBoxValue({ retailValue: 32 }), undefined);
});

test("saved retail price repopulates the manual editor in either basis", () => {
  const item = { retailValue: 350, sticksPerBox: 2 };
  assert.equal(existingRetailPriceForBasis(item, "Per cigar"), 350);
  assert.equal(existingRetailPriceForBasis(item, "Full box"), 700);
  assert.equal(existingRetailPriceForBasis({ retailValue: 350 }, "Full box"), undefined);
});

test("manual box pricing normalizes to a reusable per-cigar value", () => {
  assert.deepEqual(normalizeManualRetailPrice({ basis: "Full box", price: 320, sticksPerBox: 10 }), { unitPrice: 32, boxPrice: 320 });
  assert.deepEqual(normalizeManualRetailPrice({ basis: "Per cigar", price: 32, sticksPerBox: 10 }), { unitPrice: 32, boxPrice: 320 });
  assert.throws(() => normalizeManualRetailPrice({ basis: "Full box", price: 320 }), /number of cigars/i);
});

test("a manual full-box valuation saves unit price and box quantity into inventory", () => {
  const updated = applyRetailValuationToInventory(
    { ...priced, retailValue: undefined, sticksPerBox: undefined },
    { replacementValue: 32, replacementSticksPerBox: 10 },
  );
  assert.equal(updated.retailValue, 32);
  assert.equal(updated.sticksPerBox, 10);
  assert.equal(retailBoxValue(updated), 320);
});

test("autofill uses only sourced exact-match retail evidence and preserves existing prices", () => {
  const suggestions = knownRetailPriceSuggestions([priced, matching], [valuation]);
  assert.equal(suggestions.length, 2);
  assert.equal(suggestions[1].item.inventoryId, "I-2");
  assert.equal(suggestions[1].unitPrice, 32);
  assert.equal(suggestions[1].boxPrice, 320);
  assert.equal(knownRetailPriceSuggestions([{ ...matching, retailValue: 30 }], [valuation]).length, 0);
  assert.equal(knownRetailPriceSuggestions([matching], [{ ...valuation, sourceUrl: undefined }]).length, 0);
});
