import fs from "node:fs";
import path from "node:path";
import { InventoryInputSchema, normalizeInventory } from "../lib/inventory-model";
import { addInventoryRow } from "../lib/smartsheet";

async function main() {
  const envFile = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
  const source = process.argv.find((arg) => arg.endsWith(".json")) || "data/inventory.json";
  const apply = process.argv.includes("--apply");
  const rows = JSON.parse(fs.readFileSync(path.resolve(source), "utf8")) as unknown[];
  const valid = []; const errors = [];
  for (const [index, row] of rows.entries()) {
    const parsed = InventoryInputSchema.safeParse(row);
    if (parsed.success) valid.push(normalizeInventory(parsed.data));
    else errors.push({ row: index + 1, issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) });
  }
  const ids = valid.map((row) => row.inventoryId);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  console.log(JSON.stringify({ source, rows: rows.length, valid: valid.length, invalid: errors.length, duplicates, errors }, null, 2));
  if (errors.length || duplicates.length) process.exitCode = 1;
  else if (!apply) console.log("Dry run complete. Add --apply to write validated rows to Smartsheet.");
  else { for (const row of valid) { await addInventoryRow(row); console.log(`Imported ${row.inventoryId}`); } console.log(`Imported ${valid.length} rows.`); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
