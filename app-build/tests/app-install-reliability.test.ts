import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appBuildVersion, canonicalAppOrigin, canonicalInstallUrl, isCanonicalAppHost } from "../lib/app-install";

test("the phone installer has one permanent public identity and visible build",()=>{
  assert.equal(canonicalAppOrigin,"https://hojavia.com");
  assert.equal(canonicalInstallUrl,"https://hojavia.com/install");
  assert.equal(isCanonicalAppHost("hojavia.com"),true);
  assert.equal(isCanonicalAppHost("www.hojavia.com"),true);
  assert.equal(isCanonicalAppHost("192.168.1.104"),false);
  assert.equal(appBuildVersion({VERCEL_GIT_COMMIT_SHA:"1234567890"}),"1234567");
});

test("installation health covers obsolete hosts, connectivity, updates, home screen, and confirmation",()=>{
  const component=readFileSync(new URL("../components/install-health.tsx",import.meta.url),"utf8");
  for(const requirement of ["Old installation detected","Connection","Update service","Home screen","Confirm this phone","No special Wi-Fi"] )assert.match(component,new RegExp(requirement));
  assert.match(component,/installConfirmationEvent/);
  assert.match(component,/hojavia\.com\/install/);
  assert.match(component,/navigator\.serviceWorker\.getRegistration/);
});

test("installation confirmation is operational and remains available when analytics are disabled",()=>{
  const route=readFileSync(new URL("../app/api/product-events/route.ts",import.meta.url),"utf8");
  assert.match(route,/app-install-confirmed/);
  assert.match(route,/const operational=eventType==="app-install-confirmed"/);
});

test("founder installation status separates account, login, and phone confirmation",()=>{
  const route=readFileSync(new URL("../app/api/founder-onboarding/install-status/route.ts",import.meta.url),"utf8");
  const component=readFileSync(new URL("../components/founder-install-status.tsx",import.meta.url),"utf8");
  assert.match(route,/authorizeWrite/);
  assert.match(route,/last_sign_in_at/);
  assert.match(route,/installConfirmationEvent/);
  assert.match(component,/Account/);
  assert.match(component,/Login/);
  assert.match(component,/Phone app/);
  assert.match(component,/build/);
});
