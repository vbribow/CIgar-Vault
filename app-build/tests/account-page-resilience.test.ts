import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/account/page.tsx", "utf8");

test("account controls fail closed when any authoritative account source fails", () => {
  assert.match(page, /profileResult\.error\s*\|\|\s*preferencesResult\.error\s*\|\|\s*consentResult\.error/);
  assert.match(page, /try\{[\s\S]*loadAccountDashboardRecords\(supabase,user\.id\)[\s\S]*\}catch/);
  assert.match(page, /Account records protected/);
  assert.match(page, /Nothing is being shown as missing, expired, or reset/);
});

test("the account dashboard uses the complete owner-scoped record loader", () => {
  assert.match(page, /loadAccountDashboardRecords\(supabase,user\.id\)/);
  assert.doesNotMatch(page, /supabase\.from\("vault_records"\)/);
});
