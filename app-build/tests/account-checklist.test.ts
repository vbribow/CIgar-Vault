import assert from "node:assert/strict";
import test from "node:test";
import { buildAccountChecklist } from "../lib/account-checklist";

test("account checklist reflects records already owned by the collector", () => {
  const checklist = buildAccountChecklist(true, [
    { kind: "inventory", payload: { currentQty: 4 } },
    { kind: "smokes", payload: {} },
    { kind: "integrity", payload: { action: "inventory-backup" } },
  ], true);
  assert.equal(checklist.every(item => item.complete), true);
});

test("beta checklist remains honest before first-session evidence exists", () => {
  const checklist = buildAccountChecklist(false, [
    { kind: "inventory", payload: {} },
  ]);
  assert.deepEqual(checklist.map(item => item.complete), [false, true, false, false, false, false]);
});

test("every inventory lot must have a physical count before verification is complete", () => {
  const checklist = buildAccountChecklist(true, [
    { kind: "inventory", payload: { currentQty: 2 } },
    { kind: "inventory", payload: { currentQty: undefined } },
  ]);
  assert.equal(checklist.find(item => item.href === "/inventory-count")?.complete, false);
});
