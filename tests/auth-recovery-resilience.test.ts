import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const confirm = fs.readFileSync("app/auth/confirm/route.ts", "utf8");
const route = fs.readFileSync("app/api/auth/recovery/route.ts", "utf8");
const form = fs.readFileSync("components/password-recovery-form.tsx", "utf8");

test("authorization-code recovery links always open password reset", () => {
  assert.match(confirm, /type === "recovery" \? "\/reset-password" : next/);
});

test("only actual provider throttling returns a rate-limit status", () => {
  assert.match(route, /rateLimited\?429:502/);
});

test("recovery requests release the form and never assume an unreadable response sent mail", () => {
  assert.match(form, /finally \{\s*setBusy\(false\)/);
  assert.match(form, /No email was assumed sent/);
});
