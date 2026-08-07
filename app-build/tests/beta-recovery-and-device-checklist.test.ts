import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { betaConfirmationRecoveryUrl, betaDeviceAcceptanceSteps, betaInvitationEmail } from "../lib/beta-onboarding";

test("beta invitation recovery sends testers only to the permanent Hojavía sign-in flow", () => {
  assert.equal(betaConfirmationRecoveryUrl, "https://hojavia.com/login?mode=signin&link=invalid");
  const email = betaInvitationEmail({ name: "Tester", email: "tester@example.com" });
  assert.match(email.body, /try signing in once/i);
  assert.match(email.body, /newest link/i);
  assert.doesNotMatch(email.body, /bypass|temporary host/i);
});

test("phone acceptance covers both platforms and the essential private journey", () => {
  assert.equal(betaDeviceAcceptanceSteps.length, 7);
  const copy = betaDeviceAcceptanceSteps.map(step => `${step.label} ${step.detail}`).join(" ");
  for (const phrase of ["iPhone", "Android", "Log a Smoke", "Cigar Somm", "Sign out", "backup"])
    assert.match(copy, new RegExp(phrase, "i"));
  assert.match(copy, /do not replace/i);
});

test("founder dashboard exposes recovery and acceptance guidance without bypassing controls", () => {
  const component = readFileSync(new URL("../components/founder-onboarding.tsx", import.meta.url), "utf8");
  assert.match(component, /When an email link fails/);
  assert.match(component, /Do not create a second queue entry/);
  assert.match(component, /One checklist for iPhone and Android/);
  assert.match(component, /does not claim a device passed/);
});
