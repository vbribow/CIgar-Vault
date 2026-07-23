import assert from "node:assert/strict";
import test from "node:test";
import { findDuplicateInventoryIds, integritySummary, reconcileInventory } from "../lib/inventory-integrity";
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
