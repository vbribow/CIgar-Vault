import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildSearchResultHref, safeInternalHref } from "../lib/search-navigation";

const read = (path:string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("inventory return links can retain filters and the originating lot", () => {
  const origin = "/inventory?vaultSearch=Fuente&status=Hold&missing=value&storage=Purple+Dream#lot-INV-0020";
  const detail = buildSearchResultHref("/inventory/INV-0020", origin, "Fuente");
  const restored = new URL(detail, "https://hojavia.local").searchParams.get("searchReturn") || undefined;
  assert.equal(safeInternalHref(restored), origin);
  const manager = read("components/inventory-manager.tsx");
  assert.match(manager, /initialStatus/);
  assert.match(manager, /window\.history\.replaceState/);
  assert.match(manager, /#lot-\$\{encodeURIComponent\(inventoryId\)\}/);
});

test("core collector forms warn before abandoning unsaved work", () => {
  const guard = read("components/use-unsaved-changes.ts");
  assert.match(guard, /beforeunload/);
  assert.match(guard, /popstate/);
  assert.match(guard, /protectInternalNavigation/);
  assert.match(read("components/inventory-manager.tsx"), /onChange=\{editSafety\.markDirty\}/);
  assert.match(read("components/records-manager.tsx"), /onChange=\{recordSafety\.markDirty\}/);
});

test("insurance reports distinguish undocumented values and become cards on phones", () => {
  const report = read("app/reports/page.tsx");
  const styles = read("app/reports/reports.css");
  assert.match(report, /Not documented/);
  assert.match(report, /Pending evidence/);
  assert.match(report, /data-label="Scheduled value"/);
  assert.match(styles, /content:attr\(data-label\)/);
  assert.match(styles, /\.reportTable thead\{position:absolute/);
});
