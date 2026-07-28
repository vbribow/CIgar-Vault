import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveBrand } from "../lib/brand";

test("Hojavía is the sole product presentation", () => {
  const active = resolveBrand();
  assert.equal(active.key, "hojavia");
  assert.equal(active.name, "Hojavía");
  assert.equal(active.isPreview, false);
  assert.equal(active.labels.communityRanking, "Hojavía 25");
  assert.equal(active.labels.places, "Places");
  assert.equal(active.labels.industryHub, "Industry Hub");
});

test("retired presentation values cannot restore the former brand", () => {
  const active = resolveBrand("hojavia");
  assert.equal(active.key, "hojavia");
  assert.equal(active.name, "Hojavía");
  assert.equal(active.asciiName, "Hojavia");
  assert.equal(active.brandLine, "Knowledge carried forward.");
  assert.equal(active.isPreview, false);
  assert.deepEqual(active.labels, resolveBrand().labels);
  assert.equal(resolveBrand("Hojavia").key, "hojavia");
  assert.equal(resolveBrand("true").key, "hojavia");
  assert.equal(resolveBrand("cedriva").key, "hojavia");
});

test("the lounge directory resolves its active brand instead of relying on an undeclared global", () => {
  const source = readFileSync(
    new URL("../components/place-directory.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /import\s*\{\s*brand\s*\}\s*from\s*"@\/lib\/brand"/);
  assert.match(source, /\{brand\.name\}\s+Community/);
});

test("Hojavía owns metadata, install identity, and legacy presentation safeguards", () => {
  const seo = readFileSync(new URL("../lib/seo.ts", import.meta.url), "utf8");
  const robots = readFileSync(new URL("../app/robots.ts", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  const structuredData = readFileSync(new URL("../components/seo-json-ld.tsx", import.meta.url), "utf8");
  const resetPassword = readFileSync(new URL("../app/reset-password/page.tsx", import.meta.url), "utf8");
  const recommendationEditor = readFileSync(new URL("../components/recommendation-fact-editor.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

  assert.match(seo, /index:\s*!brand\.isPreview/);
  assert.match(seo, /follow:\s*!brand\.isPreview/);
  assert.match(robots, /if\s*\(brand\.isPreview\)[\s\S]*disallow:\s*"\/"/);
  assert.match(sitemap, /if\s*\(brand\.isPreview\)\s*return\s*\[\]/);
  assert.match(structuredData, /if\s*\(brand\.isPreview\)\s*return\s+null/);
  assert.match(resetPassword, /\{brand\.name\}/);
  assert.match(resetPassword, /!brand\.isPreview&&<HojaviaMark\/>/);
  assert.match(recommendationEditor, /\$\{brand\.name\}\s+has refreshed this recommendation/);
  assert.match(layout, /themeColor:"#173A37"/);
  assert.match(layout, /\/hojavia-mark\.svg/);
  assert.doesNotMatch(layout, /Cedriva is a retired legacy placeholder/);
});
