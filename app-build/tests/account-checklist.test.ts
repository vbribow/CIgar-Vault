import assert from "node:assert/strict";
import test from "node:test";
import { buildAccountChecklist } from "../lib/account-checklist";

test("account checklist reflects records already owned by the collector", () => {
  const checklist = buildAccountChecklist(true, [
    { kind: "inventory", payload: {} },
    { kind: "humidors", payload: {} },
    { kind: "sensors", payload: { connectionStatus: "Connected" } },
    { kind: "integrity", payload: { action: "inventory-backup" } },
  ]);
  assert.equal(checklist.every(item => item.complete), true);
});

test("beta checklist remains honest before first-session evidence exists", () => {
  const checklist = buildAccountChecklist(false, [
    { kind: "inventory", payload: {} },
  ]);
  assert.deepEqual(checklist.map(item => item.complete), [false, false, false, false, false]);
});

test("account checklist makes the required inventory backup a direct visible action", () => {
  const pending = buildAccountChecklist(true, [{ kind: "inventory", payload: {} }]);
  const backup = pending.find(item => item.label === "Download inventory backup");
  assert.deepEqual(backup, {
    label: "Download inventory backup",
    complete: false,
    href: "/api/inventory-integrity/backup?scope=account",
  });

  const complete = buildAccountChecklist(true, [
    { kind: "integrity", payload: { action: "inventory-backup" } },
  ]).find(item => item.label === "Download inventory backup");
  assert.equal(complete?.complete, true);
});
