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

test("inventory backups are required before the controlled cohort is ready", () => {
  const readiness = buildBetaReadiness({
    inviteOnly: true,
    serviceCredentials: true,
    migrationsReady: true,
    invited: 4,
    signedUp: 2,
    consented: 2,
    backedUp: 1,
    openFeedback: 1,
    criticalFeedback: 0,
  });
  assert.equal(readiness.ready, false);
  assert.equal(readiness.readyCount, 5);
  assert.equal(readiness.gates.find(gate => gate.key === "backup")?.ready, false);
});

test("beta readiness passes when every mandatory safeguard passes", () => {
  const readiness = buildBetaReadiness({
    inviteOnly: true,
    serviceCredentials: true,
    migrationsReady: true,
    invited: 5,
    signedUp: 5,
    consented: 5,
    backedUp: 5,
    openFeedback: 2,
    criticalFeedback: 0,
  });
  assert.equal(readiness.ready, true);
  assert.equal(readiness.readyCount, readiness.totalGates);
});

test("founder readiness fails closed when cohort or backup records are unavailable",()=>{
  assert.match(route,/serviceCredentials = !auth\.error && !collectors\.error && !audits\.error/);
  assert.match(route,/inventory-backup|vault_records|backedUp/);
  assert.match(route,/serviceCredentials,/);
  assert.doesNotMatch(route,/serviceCredentials: true/);
});

test("unresolved severity-1 and severity-2 feedback both hold readiness",()=>{
  const readiness=buildBetaReadiness({inviteOnly:true,serviceCredentials:true,migrationsReady:true,invited:4,signedUp:2,consented:2,backedUp:2,openFeedback:1,criticalFeedback:1});
  assert.equal(readiness.ready,false);
  assert.equal(readiness.gates.find(gate=>gate.key==="critical-feedback")?.ready,false);
  assert.match(readiness.gates.find(gate=>gate.key==="critical-feedback")?.label||"",/severity-1 or severity-2/);
});
