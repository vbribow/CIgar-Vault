import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { brand } from "../lib/brand";

test("invited testers receive one deterministic Hojavía presentation", () => {
  assert.equal(brand.name, "Hojavía");
  const source = readFileSync(new URL("../lib/brand.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /NEXT_PUBLIC_BRAND_PRESENTATION/);
});

test("inventory records prominently log a smoke from the exact lot", () => {
  const source = readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /className="button" href=\{`\/records\?inventoryId=\$\{encodeURIComponent\(item\.inventoryId\)\}#log-smoke`\}>Log a Smoke<\/Link>/);
  assert.match(source, /!isPresentationAsset&&<Link className="button"/);
});
