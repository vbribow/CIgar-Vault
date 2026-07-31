import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { auditMigrationSet } from "../lib/migration-safety";

const root = resolve(process.argv[2] || "supabase/migrations");
const filenames = (await readdir(root)).filter(name => name.endsWith(".sql")).sort();
const audit = auditMigrationSet(await Promise.all(filenames.map(async filename => ({
  filename,
  sql: await readFile(join(root, filename), "utf8"),
}))));

console.log(JSON.stringify({
  scope: "local migration files only",
  databaseConnected: false,
  databaseChanged: false,
  ...audit,
}, null, 2));

if (audit.releaseDecision !== "pass") process.exitCode = 2;
