import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import manifest from "../app/manifest";

test("mobile manifest is installable with standard and maskable artwork", () => {
  const value = manifest();
  assert.equal(value.id, "/cedriva-app");
  assert.equal(value.name, "Cedriva");
  assert.equal(value.short_name, "Cedriva");
  assert.equal(value.start_url, "/?source=cedriva-app");
  assert.equal(value.scope, "/");
  assert.equal(value.display, "standalone");
  assert.equal(value.orientation, "portrait-primary");
  assert.deepEqual(
    value.icons?.map(icon => `${icon.sizes}:${icon.purpose}`).sort(),
    ["192x192:any", "192x192:maskable", "512x512:any", "512x512:maskable"],
  );
  assert.ok(value.icons?.every(icon => icon.src.includes("cedriva-app-")));
});

test("offline support caches only public shell assets", () => {
  const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(worker, /SAFE_ASSETS/);
  assert.match(worker, /\/offline/);
  assert.match(worker, /\/manifest\.webmanifest/);
  assert.match(worker, /cedriva-app-192-v4\.png/);
  assert.match(worker, /cedriva-apple-180-v4\.png/);
  assert.doesNotMatch(worker, /cigar-vault-/);
  assert.doesNotMatch(worker, /\/inventory/);
  assert.doesNotMatch(worker, /\/api\//);
  assert.doesNotMatch(worker, /cache\.put\(event\.request/);
});

test("offline, install, and social-preview assets bypass protected-route middleware", () => {
  const proxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
  assert.match(proxy, /pathname === "\/offline"/);
  assert.match(proxy, /icons\/\|sw\.js\|manifest\.webmanifest/);
  assert.match(proxy, /og\.png\|cedriva-mark\.svg/);
});

test("mobile install guidance remains actionable across supported platforms",()=>{
  const manager=readFileSync(new URL("../components/pwa-manager.tsx",import.meta.url),"utf8");
  assert.match(manager,/beforeinstallprompt/);
  assert.match(manager,/Keep \{brand\.name\} on your phone/);
  assert.match(manager,/Add to Home Screen/);
  assert.match(manager,/Installation was not completed/);
  assert.match(manager,/Old \{brand\.name\} installation/);
  assert.match(manager,/production app/);
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
