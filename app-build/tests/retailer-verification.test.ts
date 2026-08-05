import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync("supabase/migrations/202607300002_trusted_retailer_market.sql", "utf8");
const atomicMigration = fs.readFileSync("supabase/migrations/202607300004_retailer_verification_atomicity.sql", "utf8");
const route = fs.readFileSync("app/api/retailer-market/verification/route.ts", "utf8");
const purchaseRoute = fs.readFileSync("app/api/retailer-market/purchases/route.ts", "utf8");
const panel = fs.readFileSync("components/founder-retailer-verification.tsx", "utf8");

test("retailer purchase decisions are atomic and permanently auditable", () => {
  assert.match(migration, /retailer_purchase_verification_events/);
  assert.match(migration, /review_retailer_purchase/);
  assert.match(migration, /status = 'evidence_pending'/);
  assert.match(migration, /order_reference_hash is not null/);
  assert.match(migration, /receipt_evidence_url is not null/);
  assert.match(migration, /purchase_date is not null/);
  assert.match(migration, /revoke all on function[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function[\s\S]*to service_role/);
  assert.match(atomicMigration, /update public\.retailer_purchase_sessions[\s\S]*status = 'evidence_pending'[\s\S]*returning \* into reviewed/);
  assert.match(atomicMigration, /already reviewed/);
});

test("only the founder route can review pending purchase evidence", () => {
  assert.match(route, /authorizeWrite\(request\)/);
  assert.match(route, /\.eq\("status", "evidence_pending"\)/);
  assert.match(route, /\.rpc\("review_retailer_purchase"/);
  assert.doesNotMatch(route, /order_reference_hash/);
});

test("founder review makes both outcomes explicit without auto-verifying evidence", () => {
  assert.match(panel, /Verify transaction/);
  assert.match(panel, /Reject evidence/);
  assert.match(panel, /Private receipt evidence/);
  assert.match(panel, /Relationships, affiliate arrangements, and launch placement never affect/);
  assert.doesNotMatch(panel, /status:\s*"verified"/);
});

test("purchase evidence and founder review cannot overwrite concurrent decisions", () => {
  assert.match(purchaseRoute, /\.in\("status",\["clicked","rejected"\]\)/);
  assert.match(purchaseRoute, /already awaiting verification/);
  assert.match(purchaseRoute, /changed while evidence was being submitted/);
  assert.doesNotMatch(atomicMigration, /if not exists \([\s\S]*status = 'evidence_pending'/);
});
