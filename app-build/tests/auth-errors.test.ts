import assert from"node:assert/strict";
import test from"node:test";
import{isEmailNotConfirmed}from"../lib/auth-errors";

test("recognizes Supabase email confirmation failures by stable code",()=>{
 assert.equal(isEmailNotConfirmed({code:"email_not_confirmed",message:"Authentication failed"}),true);
});

test("supports the legacy confirmation message and rejects unrelated failures",()=>{
 assert.equal(isEmailNotConfirmed({message:"Email not confirmed"}),true);
 assert.equal(isEmailNotConfirmed({code:"invalid_credentials",message:"Invalid login credentials"}),false);
});
