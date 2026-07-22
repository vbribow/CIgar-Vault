import assert from "node:assert/strict";
import test from "node:test";
import { recoveryAuthOptions } from "../lib/supabase/recovery-client";

test("password recovery never depends on a browser PKCE verifier",()=>{assert.equal(recoveryAuthOptions.flowType,"implicit");assert.equal(recoveryAuthOptions.detectSessionInUrl,true)});
