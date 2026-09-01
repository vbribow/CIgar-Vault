import assert from "node:assert/strict";
import test from "node:test";
import { privateBetaEnabled } from "../lib/beta-access";
import { buildBetaReadiness } from "../lib/beta-readiness";
import { readFileSync } from "node:fs";

const route=readFileSync("app/api/beta-readiness/route.ts","utf8");

test("invite-only mode honors explicit values and fails closed in production", () => {
  assert.equal(privateBetaEnabled("true"), true);
  assert.equal(privateBetaEnabled(" TRUE "), true);
  assert.equal(privateBetaEnabled("false"), false);
  assert.equal(privateBetaEnabled(undefined, "development"), false);
  assert.equal(privateBetaEnabled(undefined, "production"), true);
});

test("inventory backups are optional and do not block invitations", () => {
  const readiness = buildBetaReadiness({
    inviteOnly: true,
    serviceCredentials: true,
    migrationsReady: true,
    invited: 4,
    signedUp: 2,
    consented: 2,
    openFeedback: 1,
    blockingFeedback: 0,
  });
  assert.equal(readiness.ready, true);
  assert.equal(readiness.readyCount, 5);
  assert.equal(readiness.gates.some(gate => gate.key === "backup"), false);
});

test("beta readiness passes when every mandatory safeguard passes", () => {
  const readiness = buildBetaReadiness({
    inviteOnly: true,
    serviceCredentials: true,
    migrationsReady: true,
    invited: 5,
    signedUp: 5,
    consented: 5,
    openFeedback: 2,
    blockingFeedback: 0,
  });
  assert.equal(readiness.ready, true);
  assert.equal(readiness.readyCount, readiness.totalGates);
});

test("founder readiness does not query or gate on backup records",()=>{
  assert.match(route,/serviceCredentials = !auth\.error && !collectors\.error/);
  assert.doesNotMatch(route,/serviceCredentials = !auth\.error && !collectors\.error && !audits\.error/);
  assert.doesNotMatch(route,/inventory-backup|vault_records|backedUp/);
  assert.match(route,/serviceCredentials,/);
  assert.doesNotMatch(route,/serviceCredentials: true/);
});
