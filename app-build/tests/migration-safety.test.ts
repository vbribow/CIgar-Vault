import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { auditMigrationSet } from "../lib/migration-safety";

test("migration safety audit detects timestamp collisions and destructive DDL", () => {
  const audit = auditMigrationSet([
    { filename: "202607300001_create.sql", sql: "create table if not exists public.example(id uuid);" },
    { filename: "202607300001_change.sql", sql: "alter table public.example drop column old_value;" },
  ]);
  assert.deepEqual(audit.duplicateVersions, [{
    version: "202607300001",
    files: ["202607300001_change.sql", "202607300001_create.sql"],
  }]);
  assert.equal(audit.destructiveStatements.length, 1);
  assert.equal(audit.releaseDecision, "review_required");
});

test("current local migrations use unique versions after schema-level reconciliation", async () => {
  const root = new URL("../supabase/migrations/", import.meta.url);
  const filenames = (await readdir(root)).filter(name => name.endsWith(".sql")).sort();
  const audit = auditMigrationSet(await Promise.all(filenames.map(async filename => ({
    filename,
    sql: await readFile(new URL(filename, root), "utf8"),
  }))));
  assert.equal(audit.migrationCount, 33);
  assert.deepEqual(audit.duplicateVersions, []);
  assert.deepEqual(audit.destructiveStatements, []);
  assert.deepEqual(audit.runtimeDataMutationFunctions, [
    "202607240008_beta_readiness.sql",
    "202607270001_repair_duplicate_smoke.sql",
    "202607290003_hojavia_signup_consent.sql",
    "202607300002_trusted_retailer_market.sql",
    "202607300004_retailer_verification_atomicity.sql",
    "202608050001_collector_25_smoke_contributions.sql",
  ]);
  assert.equal(audit.releaseDecision, "pass");
  assert.equal(audit.manifestSha256.length, 64);
});
