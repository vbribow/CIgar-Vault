import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import manifest from "../app/manifest";

test("mobile manifest is installable with standard and maskable artwork", () => {
  const value = manifest();
  assert.equal(value.start_url, "/");
  assert.equal(value.display, "standalone");
  assert.equal(value.orientation, "portrait-primary");
  assert.deepEqual(
    value.icons?.map(icon => `${icon.sizes}:${icon.purpose}`).sort(),
    ["192x192:any", "192x192:maskable", "512x512:any", "512x512:maskable"],
  );
});

test("offline support caches only public shell assets", () => {
  const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(worker, /SAFE_ASSETS/);
  assert.match(worker, /\/offline/);
  assert.match(worker, /\/manifest\.webmanifest/);
  assert.doesNotMatch(worker, /\/inventory/);
  assert.doesNotMatch(worker, /\/api\//);
  assert.doesNotMatch(worker, /cache\.put\(event\.request/);
});

test("offline and install assets bypass protected-route middleware", () => {
  const proxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
  assert.match(proxy, /pathname === "\/offline"/);
  assert.match(proxy, /icons\/\|sw\.js\|manifest\.webmanifest/);
});
