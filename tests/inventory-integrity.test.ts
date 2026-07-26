import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInventoryRestorePlan,
  findDuplicateInventoryIds,
  integritySummary,
  reconcileInventory,
  restorableFromMaster,
} from "../lib/inventory-integrity";
import type { InventoryItem } from "../lib/types";

const lot = (inventoryId: string, currentQty = 10): InventoryItem => ({ inventoryId, brand: "Cohiba", line: "Linea 1492", vitola: "Siglo IV", currentQty });

test("classifies matched, missing, account-only, and mismatched records", () => {
    const result = reconcileInventory([lot("A"), lot("B"), lot("C", 20)], [lot("A"), lot("C", 19), lot("D")]);
    assert.deepEqual(Object.fromEntries(result.map(item => [item.inventoryId, item.status])), { C: "mismatch", B: "master-only", D: "account-only", A: "matched" });
    assert.deepEqual(result.find(item => item.inventoryId === "C")?.differences[0], { field: "currentQty", label: "Current quantity", master: 20, account: 19 });
});

test("summarizes alignment and detects duplicate IDs", () => {
    const result = reconcileInventory([lot("A"), lot("B")], [lot("A")]);
    assert.deepEqual(integritySummary(result), { total: 2, matched: 1, mismatched: 0, masterOnly: 1, accountOnly: 0, score: 50 });
    assert.deepEqual(findDuplicateInventoryIds([lot("A"), lot("A"), lot("B")]), [{ inventoryId: "A", count: 2 }]);
});

test("legacy recovery restores only records missing from the authoritative account", () => {
    const result = reconcileInventory([lot("A"), lot("B"), lot("C", 20)], [lot("A"), lot("C", 19), lot("D")]);
    assert.deepEqual(restorableFromMaster(result).map(item => item.inventoryId), ["B"]);
});

test("a collection or provenance difference can never be reported as an exact match", () => {
    const master = {
      ...lot("A"),
      collectionId: "COL-LEGENDS",
      provenanceNotes: "Purchased as part of the documented Legends collection",
    };
    const account = {
      ...lot("A"),
      collectionId: undefined,
      provenanceNotes: "Standalone acquisition",
    };
    const [result] = reconcileInventory([master], [account]);
    assert.equal(result.status, "mismatch");
    assert.deepEqual(
      result.differences.map((difference) => difference.field),
      ["collectionId", "provenanceNotes"],
    );
});

test("quantity history, acquisition cost, and evidence are part of record integrity", () => {
    const master = {
      ...lot("A"),
      originalQty: 20,
      smokedQty: 10,
      actualCost: 400,
      photoLink: "https://example.com/master.jpg",
    };
    const account = {
      ...lot("A"),
      originalQty: 18,
      smokedQty: 8,
      actualCost: 450,
      photoLink: "https://example.com/account.jpg",
    };
    const [result] = reconcileInventory([master], [account]);
    assert.equal(result.status, "mismatch");
    assert.deepEqual(
      result.differences.map((difference) => difference.field),
      ["originalQty", "smokedQty", "actualCost", "photoLink"],
    );
});

test("restore planning rejects existing, duplicate, and unknown inventory records", () => {
    assert.throws(
      () => buildInventoryRestorePlan(["A"], [lot("A")], [lot("A")]),
      /cannot be overwritten/,
    );
    assert.throws(
      () => buildInventoryRestorePlan(["A", "A"], [lot("A")], []),
      /only once/,
    );
    assert.throws(
      () => buildInventoryRestorePlan(["A"], [lot("A"), lot("A")], []),
      /manual review/,
    );
    assert.throws(
      () => buildInventoryRestorePlan(["MISSING"], [lot("A")], []),
      /Not found in Smartsheet/,
    );
});

test("restore planning returns only requested records in the requested order", () => {
    assert.deepEqual(
      buildInventoryRestorePlan(["B", "A"], [lot("A"), lot("B"), lot("C")], []),
      [lot("B"), lot("A")],
    );
});
