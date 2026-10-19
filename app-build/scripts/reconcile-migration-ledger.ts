import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";

const migrationRoot = resolve("supabase/migrations");
const files = (await readdir(migrationRoot)).filter(name => name.endsWith(".sql")).sort();
const local = await Promise.all(files.map(async filename => ({
  version: filename.split("_")[0],
  filename,
  sha256: createHash("sha256").update(await readFile(resolve(migrationRoot, filename))).digest("hex"),
})));
const ledgerArg = process.argv.find(value => value.startsWith("--production-ledger="));
const ledgerPath = ledgerArg?.slice("--production-ledger=".length);
const productionVersions = ledgerPath
  ? new Set((await readFile(resolve(ledgerPath), "utf8")).split(/\r?\n/).map(line => line.trim()).filter(Boolean))
  : new Set<string>();
const missingInProduction = ledgerPath ? local.filter(item => !productionVersions.has(item.version)).map(item => item.filename) : [];
const unknownInProduction = ledgerPath ? [...productionVersions].filter(version => !local.some(item => item.version === version)).sort() : [];

console.log(JSON.stringify({
  scope: "local manifest and supplied production version ledger",
  localMigrationCount: local.length,
  localManifestSha256: createHash("sha256").update(local.map(item => `${item.filename}\0${item.sha256}`).join("\n")).digest("hex"),
  latestLocalMigration: basename(local.at(-1)?.filename || "none"),
  productionLedgerSupplied: Boolean(ledgerPath),
  productionVersionCount: productionVersions.size,
  missingInProduction,
  unknownInProduction,
  releaseDecision: !ledgerPath || missingInProduction.length || unknownInProduction.length ? "hold" : "pass",
  nextAction: ledgerPath
    ? "Review every difference before deployment; this script never changes the database."
    : "Export the Supabase migration version column as newline-delimited text and rerun with --production-ledger=/absolute/path. No database credentials are accepted by this script.",
}, null, 2));

if (!ledgerPath || missingInProduction.length || unknownInProduction.length) process.exitCode = 2;
