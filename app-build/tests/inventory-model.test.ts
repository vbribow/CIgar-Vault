import assert from "node:assert/strict";
import test from "node:test";
import { applyTotalQuantityCorrection, consumeInventory, consumeOneInventory, hasDocumentedCurrentQuantity, hasInventoryProvenance, hasPhysicalQuantityBreakdown, InventoryInputSchema, inventoryCompleteness, manualInventoryId, normalizeInventory, parseInventoryUpdate, reconcileSmokedQuantityEdit } from "../lib/inventory-model";

test("remaining quantity is derived from original and smoked quantities", () => {
  const item = normalizeInventory({ inventoryId: "INV-1", brand: "Test", line: "Line", vitola: "Toro", originalQty: 10, smokedQty: 3 });
  assert.equal(item.currentQty, 7);
});

test("box and loose-stick quantities produce a total cigar count", () => {
  const item = normalizeInventory({ inventoryId: "INV-BOX", brand: "Test", line: "Line", vitola: "Toro", fullBoxQty: 2, sticksPerBox: 25, looseStickQty: 4, smokedQty: 3 });
  assert.equal(item.originalQty, 57);
  assert.equal(item.currentQty, 54);
});

test("a full-box quantity requires cigars per box", () => {
  const result = InventoryInputSchema.safeParse({ inventoryId: "INV-BOX", brand: "Test", line: "", vitola: "Toro", fullBoxQty: 1 });
  assert.equal(result.success, false);
});

test("legacy verified Habanos records remain editable without losing their imported status", () => {
  const existing = normalizeInventory({ inventoryId: "INV-TRINIDAD", brand: "Trinidad", line: "Vigía", vitola: "Robusto Extra", originalQty: 12, habanosVerified: true, boxCode: "TLE MAY 24", habanosSealPhotoLink: "https://example.com/seal.jpg" });
  const legacy = { ...existing, habanosSealPhotoLink: undefined, originalQty: 11 };
  const updated = parseInventoryUpdate(legacy, { ...existing, habanosSealPhotoLink: undefined });
  assert.equal(updated.habanosVerified, true);
  assert.equal(updated.originalQty, 11);
});

test("new Habanos verification still requires both verification fields", () => {
  assert.throws(() => parseInventoryUpdate({ inventoryId: "INV-NEW", brand: "Trinidad", line: "Vigía", vitola: "Robusto Extra", habanosVerified: true }));
});

test("smoking from a counted lot reduces loose sticks first", () => {
  const before = normalizeInventory({ inventoryId: "INV-BOX", brand: "Test", line: "Line", vitola: "Toro", fullBoxQty: 1, sticksPerBox: 25, looseStickQty: 2, smokedQty: 0 });
  const after = consumeOneInventory(before);
  assert.equal(after.fullBoxQty, 1);
  assert.equal(after.looseStickQty, 1);
  assert.equal(after.currentQty, 26);
  assert.equal(after.smokedQty, 1);
});

test("smoking opens a full box when no loose sticks remain", () => {
  const before = normalizeInventory({ inventoryId: "INV-BOX", brand: "Test", line: "Line", vitola: "Toro", fullBoxQty: 1, sticksPerBox: 25, looseStickQty: 0, smokedQty: 0 });
  const after = consumeOneInventory(before);
  assert.equal(after.fullBoxQty, 0);
  assert.equal(after.looseStickQty, 24);
  assert.equal(after.currentQty, 24);
});

test("one smoking entry removes the exact selected quantity without changing the original quantity", () => {
  const before = normalizeInventory({ inventoryId: "INV-MULTI", brand: "Test", line: "Line", vitola: "Toro", fullBoxQty: 1, sticksPerBox: 12, looseStickQty: 1, smokedQty: 0 });
  const after = consumeInventory(before, 3);
  assert.equal(after.originalQty, 13);
  assert.equal(after.currentQty, 10);
  assert.equal(after.smokedQty, 3);
  assert.equal(after.fullBoxQty, 0);
  assert.equal(after.looseStickQty, 10);
});

test("a smoke cannot remove more cigars than the selected lot contains", () => {
  const before = normalizeInventory({ inventoryId: "INV-SMALL", brand: "Test", line: "Line", vitola: "Toro", originalQty: 2, smokedQty: 0 });
  assert.throws(() => consumeInventory(before, 3), /only 2 cigars remaining/);
  assert.throws(() => consumeInventory(before, 0), /whole number/);
});

test("increasing smoked history opens a previously sealed 12-count box",()=>{
  const existing=normalizeInventory({inventoryId:"INV-0057",brand:"Trinidad",line:"Vigía",vitola:"Vigía",fullBoxQty:1,sticksPerBox:12,looseStickQty:0,smokedQty:0});
  const corrected=normalizeInventory(reconcileSmokedQuantityEdit({...existing,smokedQty:1},existing));
  assert.equal(corrected.originalQty,12);
  assert.equal(corrected.smokedQty,1);
  assert.equal(corrected.currentQty,11);
  assert.equal(corrected.fullBoxQty,0);
  assert.equal(corrected.looseStickQty,11);
});

test("an explicit physical count correction is never overwritten by smoke-history inference",()=>{
  const existing=normalizeInventory({inventoryId:"INV-BOX",brand:"Test",line:"Line",vitola:"Toro",fullBoxQty:1,sticksPerBox:12,looseStickQty:0,smokedQty:0});
  const corrected=normalizeInventory(reconcileSmokedQuantityEdit({...existing,smokedQty:1,fullBoxQty:0,looseStickQty:10},existing));
  assert.equal(corrected.currentQty,10);
  assert.equal(corrected.looseStickQty,10);
});

test("validation rejects smoked quantities above the original quantity", () => {
  const result = InventoryInputSchema.safeParse({ inventoryId: "INV-1", brand: "Test", line: "", vitola: "Toro", originalQty: 2, smokedQty: 3 });
  assert.equal(result.success, false);
});

test("a direct quantity correction replaces a stale box breakdown",()=>{
  const corrected=applyTotalQuantityCorrection({inventoryId:"A",brand:"Test",line:"Line",vitola:"Toro",fullBoxQty:2,sticksPerBox:20,looseStickQty:4,smokedQty:3},17);
  assert.equal(corrected.fullBoxQty,undefined);
  assert.equal(corrected.sticksPerBox,undefined);
  assert.equal(corrected.looseStickQty,undefined);
  assert.equal(normalizeInventory(corrected).currentQty,17);
  assert.equal(corrected.originalQty,20);
});
test("manual inventory references are unique-shaped and generated by Hojavía",()=>{
 assert.equal(manualInventoryId(1_000,.5),"INV-RS-4ZSOV");
 assert.match(manualInventoryId(),/^INV-[A-Z0-9]+-[A-Z0-9]{5}$/);
});

test("completeness reflects the five visible inventory audit categories", () => {
  const base = { inventoryId: "INV-1", brand: "Test", line: "", vitola: "Toro", originalQty: 10, currentQty: 10, vintage: 2024 };
  assert.equal(inventoryCompleteness(base), 20);
  assert.equal(inventoryCompleteness({ ...base, fullBoxQty: 0, looseStickQty: 10, retailValue: 25, storageLocationId: "H-1", provenanceDocumentLink: "https://example.com/receipt.pdf" }), 100);
});

test("physical quantity completion requires both box and loose-stick counts, including valid zeroes", () => {
  const base = { inventoryId: "INV-1", brand: "Test", line: "", vitola: "Toro" };
  assert.equal(hasPhysicalQuantityBreakdown(base), false);
  assert.equal(hasPhysicalQuantityBreakdown({ ...base, fullBoxQty: 0 }), false);
  assert.equal(hasPhysicalQuantityBreakdown({ ...base, looseStickQty: 0 }), false);
  assert.equal(hasPhysicalQuantityBreakdown({ ...base, fullBoxQty: 0, looseStickQty: 0 }), true);
});

test("provenance accepts collector notes or a linked ownership document", () => {
  const base = { inventoryId: "INV-1", brand: "Test", line: "", vitola: "Toro" };
  assert.equal(hasInventoryProvenance(base), false);
  assert.equal(hasInventoryProvenance({ ...base, provenanceNotes: "Purchased from an authorized retailer." }), true);
  assert.equal(hasInventoryProvenance({ ...base, provenanceDocumentLink: "https://example.com/receipt.pdf" }), true);
  assert.equal(hasInventoryProvenance({ ...base, provenanceNotes: "  ", provenanceDocumentLink: "  " }), false);
});

test("a saved total is documented quantity without requiring a box and loose-stick split", () => {
  const totalOnly = { inventoryId: "INV-TOTAL", brand: "Test", line: "", vitola: "Toro", currentQty: 10 };
  const boxCount = normalizeInventory({ inventoryId: "INV-BOX", brand: "Test", line: "", vitola: "Toro", fullBoxQty: 1, sticksPerBox: 10 });
  const looseCount = normalizeInventory({ inventoryId: "INV-LOOSE", brand: "Test", line: "", vitola: "Toro", looseStickQty: 3 });
  const unknown = { inventoryId: "INV-UNKNOWN", brand: "Test", line: "", vitola: "Toro" };
  assert.equal(hasDocumentedCurrentQuantity(totalOnly), true);
  assert.equal(hasDocumentedCurrentQuantity(boxCount), true);
  assert.equal(hasDocumentedCurrentQuantity(looseCount), true);
  assert.equal(hasDocumentedCurrentQuantity(unknown), false);
});

test("Cuban verification accepts a box code and seal photo URL", () => {
  const parsed = InventoryInputSchema.parse({ inventoryId: "INV-CU", brand: "Cohiba", line: "Robustos", vitola: "Robusto", boxCode: "AMO OCT 16", habanosSealPhotoLink: "https://example.com/seal.jpg" });
  assert.equal(parsed.boxCode, "AMO OCT 16");
  assert.equal(parsed.habanosSealPhotoLink, "https://example.com/seal.jpg");
});

test("Habanos evidence keeps acquisition, jurisdiction, and official lookup details separate", () => {
  const parsed = InventoryInputSchema.parse({
    inventoryId: "INV-CU-EVIDENCE",
    brand: "Cohiba",
    line: "Robustos",
    vitola: "Robusto",
    acquisitionSeller: "Example seller",
    acquisitionDate: "2026-07-29",
    acquisitionSourceUrl: "https://example.com/listing",
    acquisitionReceiptLink: "https://example.com/receipt",
    purchaseJurisdiction: "Example jurisdiction",
    habanosVerificationDate: "2026-07-29",
    habanosVerificationResult: "Producer lookup response recorded",
    habanosVerificationEvidenceLink: "https://example.com/private-evidence",
  });
  assert.equal(parsed.purchaseJurisdiction, "Example jurisdiction");
  assert.equal(parsed.habanosVerificationResult, "Producer lookup response recorded");
});
