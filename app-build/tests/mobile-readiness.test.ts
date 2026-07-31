import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import manifest from "../app/manifest";

test("mobile manifest exposes only the Hojavía product identity", () => {
  const value = manifest();
  assert.equal(value.id, "/hojavia-app");
  assert.equal(value.name, "Hojavía");
  assert.equal(value.short_name, "Hojavia");
  assert.equal(value.start_url, "/?source=hojavia-app");
  assert.equal(value.scope, "/");
  assert.equal(value.display, "standalone");
  assert.equal(value.orientation, "portrait-primary");
  assert.deepEqual(value.icons?.map(icon => icon.src), [
    "/icons/hojavia-app-192.png",
    "/icons/hojavia-app-512.png",
    "/icons/hojavia-app-512.png",
    "/hojavia-mark.svg",
  ]);
  assert.equal(value.icons?.some(icon => icon.purpose === "maskable"), true);
});

test("offline support caches only public shell assets", () => {
  const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(worker, /SAFE_ASSETS/);
  assert.match(worker, /\/offline/);
  assert.match(worker, /\/manifest\.webmanifest/);
  assert.match(worker, /hojavia-mark\.svg/);
  assert.doesNotMatch(worker, /cedriva-/);
  assert.doesNotMatch(worker, /cigar-vault-/);
  assert.doesNotMatch(worker, /\/inventory/);
  assert.doesNotMatch(worker, /\/api\//);
  assert.doesNotMatch(worker, /cache\.put\(event\.request/);
});

test("offline, install, and social-preview assets bypass protected-route middleware", () => {
  const proxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
  assert.match(proxy, /pathname === "\/offline"/);
  assert.match(proxy, /icons\/\|sw\.js\|manifest\.webmanifest/);
  assert.match(proxy, /hojavia-mark\.svg/);
  assert.match(proxy, /pathname === "\/install"/);
});

test("mobile install guidance remains actionable across supported platforms",()=>{
  const manager=readFileSync(new URL("../components/pwa-manager.tsx",import.meta.url),"utf8");
  assert.match(manager,/beforeinstallprompt/);
  assert.match(manager,/Keep \{brand\.name\} on your phone/);
  assert.match(manager,/Add to Home Screen/);
  assert.match(manager,/Installation was not completed/);
  assert.match(manager,/Old \{brand\.name\} installation/);
  assert.match(manager,/production app/);
  assert.match(manager,/const productionHost="hojavia\.com"/);
  assert.match(manager,/isActiveProductHostname\(window\.location\.hostname\)/);
  assert.match(manager,/standalone\)\)setLegacyHost/);
  assert.match(manager,/Reinstall safely/);
});

test("authentication survives reloads and sign-out clears the server session",()=>{
  const actions=readFileSync(new URL("../app/login/actions.ts",import.meta.url),"utf8");
  const proxy=readFileSync(new URL("../lib/supabase/proxy.ts",import.meta.url),"utf8");
  assert.match(actions,/await supabase\.auth\.signOut\(\)/);
  assert.match(actions,/redirect\("\/login"\)/);
  assert.match(proxy,/await supabase\.auth\.getClaims\(\)/);
  assert.match(proxy,/url\.pathname = "\/login"/);
  assert.match(proxy,/request\.nextUrl\.pathname === "\/login"/);
});
