import assert from "node:assert/strict";
import test from "node:test";
import { isActiveProductHostname,isPrivatePreviewHostname } from "../lib/preview-host";

test("current Hojavía production hosts are recognized even before the custom domain cutover", () => {
  for (const hostname of [
    "hojavia.com",
    "www.hojavia.com",
    "c-igar-vault-lmug.vercel.app",
    "cedriva-app.brian-bowers-3344.chatgpt.site",
  ]) {
    assert.equal(isActiveProductHostname(hostname), true, hostname);
  }
  assert.equal(isActiveProductHostname("old-hojavia.example.com"), false);
});

test("loopback and private-network preview hosts are not treated as obsolete installations", () => {
  for (const hostname of [
    "localhost",
    "preview.localhost",
    "127.0.0.1",
    "127.0.0.8",
    "::1",
    "[::1]",
    "10.0.0.12",
    "172.16.0.5",
    "172.31.255.4",
    "192.168.1.104",
  ]) {
    assert.equal(isPrivatePreviewHostname(hostname), true, hostname);
  }
});

test("public and obsolete deployment hosts still receive the migration warning", () => {
  for (const hostname of [
    "old-hojavia.example.com",
    "172.15.0.1",
    "172.32.0.1",
    "8.8.8.8",
  ]) {
    assert.equal(isPrivatePreviewHostname(hostname), false, hostname);
  }
});
