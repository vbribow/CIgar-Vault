import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const route = fs.readFileSync("app/api/account/recovery/restore/route.ts", "utf8");
const previewRoute = fs.readFileSync("app/api/account/recovery/preview/route.ts", "utf8");

test("vault recovery reads only the authenticated collector's records", () => {
  assert.match(route, /\.select\("kind,record_id,payload,updated_at"\)\.eq\("user_id",user\.id\)/);
});

test("vault recovery writes restored records and its audit atomically", () => {
  assert.equal((route.match(/\.from\("vault_records"\)\.upsert/g) || []).length, 1);
  assert.match(route, /kind:"integrity" as const/);
  assert.doesNotMatch(route, /index\+=500/);
});

test("vault recovery requires explicit intent and flags different-account files", () => {
  assert.match(route, /recoveryConfirmationPhrase\(value\.mode\)/);
  assert.match(route, /ownerMatch==="different"&&!input\.acknowledgeDifferentOwner/);
  assert.match(route, /sourceOwnerMatch:ownerMatch/);
  assert.match(previewRoute, /ownerMatch:recoveryOwnerMatch/);
});
