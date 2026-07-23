import assert from "node:assert/strict";
import test from "node:test";
import { accountSecuritySummary, buildAccountExport } from "../lib/account-security";

const records = [
  { kind:"inventory", record_id:"I1", payload:{ brand:"Cohiba" }, updated_at:"2026-07-20" },
  { kind:"humidors", record_id:"H1", payload:{ name:"Main" }, updated_at:"2026-07-20" },
  { kind:"integrity", record_id:"B1", payload:{ action:"inventory-backup", createdAt:"2026-07-21T10:00:00Z", recordCount:12 } },
  { kind:"integrity", record_id:"B0", payload:{ action:"inventory-backup", createdAt:"2026-07-20T10:00:00Z", recordCount:10 } },
];

test("security summary finds the latest backup without counting audit records", () => {
  assert.deepEqual(accountSecuritySummary(records), { recordCount:2, lastBackupAt:"2026-07-21T10:00:00Z", lastBackupCount:12 });
});

test("complete account export preserves every owned record", () => {
  const payload=buildAccountExport({userId:"U1",email:"collector@example.com",profile:{collection_name:"Vault"},preferences:{product_analytics:false},records,createdAt:"2026-07-21T12:00:00Z"});
  assert.equal(payload.format,"cigar-vault-account-export");
  assert.equal(payload.recordCount,4);
  assert.equal(payload.records[0].record_id,"I1");
  assert.deepEqual(payload.preferences,{product_analytics:false});
});
