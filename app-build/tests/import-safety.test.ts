import assert from "node:assert/strict";
import test from "node:test";
import { importRecordFingerprint, safelyRollbackImportedRecords } from "../lib/import-safety";

test("import fingerprints are stable across object key order", () => {
  assert.equal(
    importRecordFingerprint({ inventoryId: "A", nested: { quantity: 5, line: "Reserva" } }),
    importRecordFingerprint({ nested: { line: "Reserva", quantity: 5 }, inventoryId: "A" }),
  );
});

test("rollback removes unchanged imports and protects later collector edits", () => {
  const imported = [
    { inventoryId: "A", brand: "Cohiba", currentQty: 20 },
    { inventoryId: "B", brand: "Fuente", currentQty: 10 },
  ];
  const fingerprints = Object.fromEntries(imported.map(item => [item.inventoryId, importRecordFingerprint(item)]));
  const current = [
    imported[0],
    { ...imported[1], currentQty: 9 },
  ];
  const result = safelyRollbackImportedRecords(current, item => item.inventoryId, fingerprints);
  assert.deepEqual(result.removable, ["A"]);
  assert.deepEqual(result.protectedIds, ["B"]);
  assert.deepEqual(result.alreadyMissing, []);
});

test("rollback treats previously removed records as already missing", () => {
  const result = safelyRollbackImportedRecords(
    [],
    (item: { inventoryId: string }) => item.inventoryId,
    { A: importRecordFingerprint({ inventoryId: "A" }) },
  );
  assert.deepEqual(result.alreadyMissing, ["A"]);
});
