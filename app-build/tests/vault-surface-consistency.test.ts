import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("private downstream surfaces resolve inventory through the authoritative account loader", async () => {
  const files = [
    "../app/cigars/[identityId]/page.tsx",
    "../app/collections/page.tsx",
    "../app/reports/page.tsx",
    "../app/valuations/page.tsx",
    "../app/api/cigar-somm/route.ts",
    "../app/api/search/route.ts",
  ];
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /loadInventory\(\)/, `${file} must use authoritative inventory`);
  }
});

test("complete export, insurance PDF, and recovery are explicitly owner scoped", async () => {
  const exportRoute = await readFile(new URL("../app/api/account/export/route.ts", import.meta.url), "utf8");
  const pdfRoute = await readFile(new URL("../app/api/reports/insurance-pdf/route.ts", import.meta.url), "utf8");
  const recoveryRoute = await readFile(new URL("../app/api/account/recovery/restore/route.ts", import.meta.url), "utf8");
  assert.match(exportRoute, /\.eq\("user_id",user\.id\)/);
  assert.match(pdfRoute, /\.eq\("user_id",user\.id\)/);
  assert.match(recoveryRoute, /\.eq\("user_id",user\.id\)/);
  assert.match(recoveryRoute, /user_id:user\.id/);
});
