import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { brand } from "../lib/brand";

test("invited testers receive one deterministic Hojavía presentation", () => {
  assert.equal(brand.name, "Hojavía");
  const source = readFileSync(new URL("../lib/brand.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /NEXT_PUBLIC_BRAND_PRESENTATION/);
});

test("inventory smoking-history navigation preserves the exact lot selection", () => {
  const source = readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /records\?inventoryId=\$\{encodeURIComponent\(item\.inventoryId\)\}#log-smoke/);
});
