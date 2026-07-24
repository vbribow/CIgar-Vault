import assert from "node:assert/strict";
import test from "node:test";
import {
  dataAuthorityFor,
  dataAuthorityIsUnambiguous,
  vaultDataAuthority,
  vaultRecordKinds,
} from "../lib/data-authority";

test("every private record kind has exactly one signed-in authority", () => {
  assert.equal(Object.keys(vaultDataAuthority).length, vaultRecordKinds.length);
  for (const kind of vaultRecordKinds) {
    assert.equal(dataAuthorityFor(kind, true), "supabase-private-vault");
    assert.match(vaultDataAuthority[kind].conflictRule, /Supabase record wins/);
  }
  assert.equal(dataAuthorityIsUnambiguous(), true);
});

test("Smartsheet is a fallback only for legacy founder record groups", () => {
  assert.equal(dataAuthorityFor("inventory", false), "smartsheet-founder-master");
  assert.equal(dataAuthorityFor("collections", false), "smartsheet-founder-master");
  assert.equal(dataAuthorityFor("wishlist", false), "none");
  assert.equal(dataAuthorityFor("integrity", false), "none");
  assert.equal(vaultDataAuthority.inventory.migrationDirection, "explicit-smartsheet-to-supabase");
});

test("the authority contract never permits implicit bidirectional synchronization", () => {
  for (const rule of Object.values(vaultDataAuthority)) {
    assert.notEqual(rule.migrationDirection, "bidirectional");
    assert.match(rule.conflictRule, /never merged or copied over it automatically/);
  }
});
