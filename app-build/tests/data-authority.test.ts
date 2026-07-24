import assert from "node:assert/strict";
import test from "node:test";
import {
  dataAuthorityFor,
  dataAuthorityIsUnambiguous,
  vaultDataAuthority,
  vaultRecordKinds,
  scheduledVaultAuthority,
} from "../lib/data-authority";

test("every private record kind has exactly one signed-in authority", () => {
  assert.equal(Object.keys(vaultDataAuthority).length, vaultRecordKinds.length);
  for (const kind of vaultRecordKinds) {
    assert.equal(dataAuthorityFor(kind, true), "supabase-private-vault");
    assert.match(vaultDataAuthority[kind].conflictRule, /Supabase record wins/);
  }
  assert.equal(dataAuthorityIsUnambiguous(), true);
});

test("private records have no signed-out production fallback", () => {
  assert.equal(dataAuthorityFor("inventory", false), "none");
  assert.equal(dataAuthorityFor("collections", false), "none");
  assert.equal(dataAuthorityFor("wishlist", false), "none");
  assert.equal(dataAuthorityFor("integrity", false), "none");
  assert.equal(vaultDataAuthority.inventory.migrationDirection, "explicit-smartsheet-to-supabase");
});

test("the authority contract never permits implicit bidirectional synchronization", () => {
  for (const rule of Object.values(vaultDataAuthority)) {
    assert.notEqual(rule.migrationDirection, "bidirectional");
    assert.match(rule.conflictRule, /never overwrite or merge an existing account record automatically/);
  }
});

test("scheduled vault work prefers Supabase over a configured legacy Smartsheet", () => {
  assert.equal(
    scheduledVaultAuthority({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      USE_MOCK_DATA: "false",
      SMARTSHEET_ACCESS_TOKEN: "token",
      SMARTSHEET_INVENTORY_SHEET_ID: "sheet",
    }),
    "supabase-private-vault",
  );
});

test("scheduled vault work uses Smartsheet only as an explicit legacy fallback", () => {
  assert.equal(
    scheduledVaultAuthority({
      USE_MOCK_DATA: "false",
      SMARTSHEET_ACCESS_TOKEN: "token",
      SMARTSHEET_INVENTORY_SHEET_ID: "sheet",
    }),
    "smartsheet-legacy-operations",
  );
  assert.equal(scheduledVaultAuthority({ NODE_ENV: "production" }), "unavailable");
});
