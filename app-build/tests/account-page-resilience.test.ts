import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/account/page.tsx", "utf8");

test("account controls fail closed when any authoritative account source fails", () => {
  assert.match(page, /profileResult\.error\|\|preferencesResult\.error\|\|vaultResult\.error\|\|consentResult\.error/);
  assert.match(page, /Account records protected/);
  assert.match(page, /Nothing is being shown as missing, expired, or reset/);
});

test("the Vault account query is explicitly scoped to the signed-in collector", () => {
  assert.match(page, /\.from\("vault_records"\)\.select\("kind,record_id,payload,updated_at"\)\.eq\("user_id",user\.id\)/);
});
