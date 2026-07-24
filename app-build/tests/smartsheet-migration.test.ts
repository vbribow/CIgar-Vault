import assert from "node:assert/strict";
import test from "node:test";
import { planAdditiveSmartsheetMigration } from "../lib/smartsheet-migration";
import type { VaultRecordKind } from "../lib/data-authority";

test("Smartsheet migration adds missing records without overwriting account records", () => {
  const existing = new Map<VaultRecordKind, ReadonlySet<string>>([
    ["inventory", new Set(["INV-EXISTING"])],
  ]);
  const plan = planAdditiveSmartsheetMigration(
    [
      { kind: "inventory", recordId: "INV-EXISTING", payload: { quantity: 99 } },
      { kind: "inventory", recordId: "INV-NEW", payload: { quantity: 2 } },
    ],
    existing,
  );
  assert.deepEqual(plan.importable.map((record) => record.recordId), ["INV-NEW"]);
  assert.deepEqual(plan.preserved.map((record) => record.recordId), ["INV-EXISTING"]);
  assert.match(plan.policy, /Account records are authoritative/);
});

test("migration preserves record identity independently for each data group", () => {
  const existing = new Map<VaultRecordKind, ReadonlySet<string>>([
    ["inventory", new Set(["SHARED-ID"])],
    ["valuations", new Set()],
  ]);
  const plan = planAdditiveSmartsheetMigration(
    [
      { kind: "inventory", recordId: "SHARED-ID", payload: {} },
      { kind: "valuations", recordId: "SHARED-ID", payload: {} },
    ],
    existing,
  );
  assert.equal(plan.preserved[0].kind, "inventory");
  assert.equal(plan.importable[0].kind, "valuations");
});
