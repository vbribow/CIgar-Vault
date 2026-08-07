import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { emailLinkDestination, invalidEmailLinkPath } from "../lib/auth-email-link";

test("recovery links always lead to password reset while confirmations honor a safe next page",()=>{assert.equal(emailLinkDestination("recovery","/account"),"/reset-password");assert.equal(emailLinkDestination("signup","/account"),"/account")});
test("used or expired links explain sign-in and resend options without technical language",()=>{const path=invalidEmailLinkPath("/account");const url=new URL(path,"https://hojavia.com");assert.equal(url.searchParams.get("mode"),"signin");assert.equal(url.searchParams.get("link"),"invalid");assert.match(url.searchParams.get("error")||"",/already been used or has expired/);assert.match(url.searchParams.get("error")||"",/sign in below/);assert.equal(url.searchParams.get("next"),"/account")});
test("both supported email-link routes accept code and token-hash formats and recover an existing session",()=>{for(const file of ["../app/auth/confirm/route.ts","../app/auth/callback/route.ts"]){const route=readFileSync(new URL(file,import.meta.url),"utf8");assert.match(route,/exchangeCodeForSession/);assert.match(route,/verifyOtp/);assert.match(route,/getUser/);assert.match(route,/invalidEmailLinkPath/)}});
