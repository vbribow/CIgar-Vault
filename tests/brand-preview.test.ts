import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveBrand } from "../lib/brand";

test("Cedriva remains only as the default legacy presentation", () => {
  const active = resolveBrand();
  assert.equal(active.key, "cedriva");
  assert.equal(active.name, "Cedriva");
  assert.equal(active.isPreview, false);
  assert.equal(active.labels.communityRanking, "Collector 25");
  assert.equal(active.labels.places, "Places");
  assert.equal(active.labels.industryHub, "Industry Hub");
});

test("Hojavía is available only through the explicit preview value", () => {
  const preview = resolveBrand("hojavia");
  assert.equal(preview.key, "hojavia");
  assert.equal(preview.name, "Hojavía");
  assert.equal(preview.asciiName, "Hojavia");
  assert.equal(preview.brandLine, "Knowledge carried forward.");
  assert.equal(preview.isPreview, true);
  assert.deepEqual(preview.labels, resolveBrand().labels);
  assert.equal(resolveBrand("Hojavia").key, "cedriva");
  assert.equal(resolveBrand("true").key, "cedriva");
});

test("the lounge directory resolves its active brand instead of relying on an undeclared global", () => {
  const source = readFileSync(
    new URL("../components/place-directory.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /import\s*\{\s*brand\s*\}\s*from\s*"@\/lib\/brand"/);
  assert.match(source, /\{brand\.name\}\s+Community/);
});
