import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navigation = readFileSync(new URL("../components/app-navigation.tsx", import.meta.url), "utf8");
const deviceAwareSignOut = readFileSync(new URL("../components/device-aware-sign-out.tsx", import.meta.url), "utf8");
const recoveryPoint = readFileSync(new URL("../components/create-recovery-point.tsx", import.meta.url), "utf8");

test("community navigation uses the Collectors’ Lounge identity", () => {
  assert.match(navigation, />Collectors’ Lounge<\/Link>/);
  assert.match(navigation, /\["\/community","Collectors’ Lounge"/);
});
const inventory = readFileSync(new URL("../app/inventory/page.tsx", import.meta.url), "utf8");

test("collections remain directly reachable through the mobile Vault and inventory", () => {
  assert.match(navigation, /matches\(pathname,"\/collections"\)/);
  assert.match(navigation, /<small>Vault<\/small>/);
  assert.match(inventory, /Valuable Collections/);
});

test("mobile navigation exposes a focused five-item bar and complete More sheet",()=>{
  for(const label of["Home","Discover","Log Smoke","Vault","More"])assert.match(navigation,new RegExp(`<small>${label}<\\/small>`));
  assert.match(navigation, /aria-haspopup="dialog"/);
  assert.match(navigation, /id="mobile-more-sheet"/);
  assert.match(navigation, /Search \{brand\.name\}/);
  assert.match(navigation, /mobileFeaturedLinks\.map/);
  assert.match(navigation, /moreLinks\.map/);
  assert.match(navigation, /\["\/humidors","Humidors"/);
  assert.match(navigation, /\["\/sensors","Sensors"/);
  assert.match(navigation, /\["\/cigar-somm","Cigar Somm"/);
  assert.match(navigation, /<DeviceAwareSignOut compact \/>/);
  assert.match(deviceAwareSignOut, /action=\{signOut\}/);
  assert.match(deviceAwareSignOut, /useFormStatus/);
  assert.match(deviceAwareSignOut, /Signing out…/);
  assert.match(deviceAwareSignOut, /saved account records stay unchanged/);
});

test("mobile More keeps the protected Beta Desk prominent",()=>{
  assert.match(navigation, /\["\/founder-onboarding","Beta Desk","Review tester feedback and beta operations","β"\]/);
  assert.match(navigation, /\["\/founder-onboarding","Beta Desk","Open tester feedback, invitations, and setup progress"\]/);
});

test("mobile account safeguards prevent repeat actions and announce their outcome",()=>{
  assert.match(recoveryPoint, /if \(busy\) return/);
  assert.match(recoveryPoint, /aria-busy=\{busy\}/);
  assert.match(recoveryPoint, /role=\{failed \? "alert" : "status"\}/);
  assert.match(recoveryPoint, /aria-atomic="true"/);
});

test("mobile More destinations close the overlay even when choosing the current page",()=>{
  assert.match(navigation,/mobileFeaturedLinks\.map[\s\S]*?<Link href=\{href\} onClick=\{\(\)=>closeMobileMore\(\)\}/);
  assert.match(navigation,/moreLinks\.map[\s\S]*?<Link href=\{href\} onClick=\{\(\)=>closeMobileMore\(\)\}/);
});
