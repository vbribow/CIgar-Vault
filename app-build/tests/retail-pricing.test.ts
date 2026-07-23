import assert from "node:assert/strict";
import test from "node:test";
import { knownRetailPriceSuggestions, normalizeManualRetailPrice, retailBoxValue } from "../lib/retail-pricing";
import type { InventoryItem, Valuation } from "../lib/types";

const priced: InventoryItem = { inventoryId: "I-1", brand: "Padrón", line: "1964 Anniversary", vitola: "Exclusivo", vintage: 2024, currentQty: 5, sticksPerBox: 10 };
const matching: InventoryItem = { ...priced, inventoryId: "I-2", brand: "Padron" };
const valuation: Valuation = { valuationId: "V-1", inventoryId: "I-1", valuationDate: "2026-07-23", replacementValue: 32, source: "Authorized retailer", sourceUrl: "https://example.com/padron", confidence: "High" };

test("retail pricing calculates per-box value from a per-cigar price", () => {
  assert.equal(retailBoxValue({ retailValue: 32, sticksPerBox: 10 }), 320);
  assert.equal(retailBoxValue({ retailValue: 32 }), undefined);
});

test("manual box pricing normalizes to a reusable per-cigar value", () => {
  assert.deepEqual(normalizeManualRetailPrice({ basis: "Full box", price: 320, sticksPerBox: 10 }), { unitPrice: 32, boxPrice: 320 });
  assert.deepEqual(normalizeManualRetailPrice({ basis: "Per cigar", price: 32, sticksPerBox: 10 }), { unitPrice: 32, boxPrice: 320 });
  assert.throws(() => normalizeManualRetailPrice({ basis: "Full box", price: 320 }), /number of cigars/i);
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
