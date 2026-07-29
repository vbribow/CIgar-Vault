import assert from "node:assert/strict";
import test from "node:test";
import { recoveryAuthOptions } from "../lib/supabase/recovery-client";
import { formatRecoveryCountdown, RECOVERY_RATE_LIMIT_SECONDS, RECOVERY_SUCCESS_COOLDOWN_SECONDS, recoveryCooldownUntil, recoverySecondsRemaining } from "../lib/recovery-cooldown";

test("password recovery never depends on a browser PKCE verifier",()=>{assert.equal(recoveryAuthOptions.flowType,"implicit");assert.equal(recoveryAuthOptions.detectSessionInUrl,true)});
test("successful recovery requests pause for ten minutes",()=>{const now=1_000;const until=recoveryCooldownUntil(RECOVERY_SUCCESS_COOLDOWN_SECONDS,now);assert.equal(RECOVERY_SUCCESS_COOLDOWN_SECONDS,600);assert.equal(until,601_000);assert.equal(recoverySecondsRemaining(until,now),600);assert.equal(formatRecoveryCountdown(600),"10:00")});
test("provider rate limits retain the full safety window",()=>{const now=1_000;const until=recoveryCooldownUntil(RECOVERY_RATE_LIMIT_SECONDS,now);assert.equal(RECOVERY_RATE_LIMIT_SECONDS,3900);assert.equal(recoverySecondsRemaining(until,now),3900);assert.equal(formatRecoveryCountdown(3900),"65:00");assert.equal(recoverySecondsRemaining(until,until+1),0)});
