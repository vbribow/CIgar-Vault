import assert from "node:assert/strict";
import test from "node:test";
import { buildAccountChecklist } from "../lib/account-checklist";

test("account checklist reflects records already owned by the collector", () => {
  const checklist = buildAccountChecklist(true, [
    { kind: "inventory", payload: {} },
    { kind: "humidors", payload: {} },
    { kind: "sensors", payload: { connectionStatus: "Connected" } },
  ]);
  assert.equal(checklist.every(item => item.complete), true);
});

test("a registered but disconnected sensor remains an incomplete step", () => {
  const checklist = buildAccountChecklist(false, [
    { kind: "sensors", payload: { connectionStatus: "Setup required" } },
  ]);
  assert.deepEqual(checklist.map(item => item.complete), [false, false, false, false]);
});
