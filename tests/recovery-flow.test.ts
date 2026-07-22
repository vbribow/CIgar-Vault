import assert from "node:assert/strict";
import test from "node:test";
import { recoveryAuthOptions } from "../lib/supabase/recovery-client";
import { formatRecoveryCountdown, RECOVERY_COOLDOWN_SECONDS, recoveryCooldownUntil, recoverySecondsRemaining } from "../lib/recovery-cooldown";

test("password recovery never depends on a browser PKCE verifier",()=>{assert.equal(recoveryAuthOptions.flowType,"implicit");assert.equal(recoveryAuthOptions.detectSessionInUrl,true)});
test("recovery cooldown protects the full provider reset window",()=>{const now=1_000;const until=recoveryCooldownUntil(now);assert.equal(RECOVERY_COOLDOWN_SECONDS,3900);assert.equal(until,3_901_000);assert.equal(recoverySecondsRemaining(until,now),3900);assert.equal(formatRecoveryCountdown(3900),"65:00");assert.equal(formatRecoveryCountdown(61),"1:01");assert.equal(recoverySecondsRemaining(until,until+1),0)});
