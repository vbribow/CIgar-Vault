import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

test("official Habanos journeys open authoritative sources without replacing Hojavía", () => {
  const catalog = fs.readFileSync(path.join(root, "app/catalog/page.tsx"), "utf8");
  const verification = fs.readFileSync(path.join(root, "app/verification/page.tsx"), "utf8");
  assert.match(catalog, /href=\{habanosBrandSource\}>Official Habanos directory/);
  assert.match(verification, /href=\{HABANOS_AUTHENTICITY_URL\} target="_blank" rel="noreferrer">Open official lookup/);
  assert.doesNotMatch(catalog, /href=\{habanosBrandSource\} target="_blank"/);
});
