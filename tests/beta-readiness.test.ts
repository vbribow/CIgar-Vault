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

test("beta readiness blocks invitations when any safeguard is missing", () => {
  const readiness = buildBetaReadiness({
    inviteOnly: true,
    serviceCredentials: true,
    migrationsReady: true,
    invited: 4,
    signedUp: 2,
    consented: 2,
    backedUp: 1,
    openFeedback: 1,
    blockingFeedback: 0,
  });
  assert.equal(readiness.ready, false);
  assert.equal(readiness.readyCount, 5);
  assert.equal(readiness.gates.find(gate => gate.key === "backup")?.ready, false);
});

test("beta readiness passes only when every signed-up tester is protected", () => {
  const readiness = buildBetaReadiness({
    inviteOnly: true,
    serviceCredentials: true,
    migrationsReady: true,
    invited: 5,
    signedUp: 5,
    consented: 5,
    backedUp: 5,
    openFeedback: 2,
    blockingFeedback: 0,
  });
  assert.equal(readiness.ready, true);
  assert.equal(readiness.readyCount, readiness.totalGates);
});

test("founder readiness fails closed when cohort or backup records are unavailable",()=>{
  assert.match(route,/serviceCredentials = !auth\.error && !collectors\.error && !audits\.error/);
  assert.match(route,/serviceCredentials,/);
  assert.doesNotMatch(route,/serviceCredentials: true/);
});
