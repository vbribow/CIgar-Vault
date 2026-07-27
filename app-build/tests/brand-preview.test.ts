import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveBrand } from "../lib/brand";

test("Hojavía is the enforced default beta presentation", () => {
  const active = resolveBrand();
  assert.equal(active.key, "hojavia");
  assert.equal(active.name, "Hojavía");
  assert.equal(active.isPreview, true);
  assert.equal(active.labels.communityRanking, "Collector 25");
  assert.equal(active.labels.places, "Places");
  assert.equal(active.labels.industryHub, "Industry Hub");
});

test("Cedriva requires an explicit founder-controlled legacy value", () => {
  const preview = resolveBrand("hojavia");
  assert.equal(preview.key, "hojavia");
  assert.equal(preview.name, "Hojavía");
  assert.equal(preview.asciiName, "Hojavia");
  assert.equal(preview.brandLine, "Knowledge carried forward.");
  assert.equal(preview.isPreview, true);
  assert.deepEqual(preview.labels, resolveBrand().labels);
  assert.equal(resolveBrand("Hojavia").key, "hojavia");
  assert.equal(resolveBrand("true").key, "hojavia");
  assert.equal(resolveBrand("cedriva").key, "cedriva");
});

test("the lounge directory resolves its active brand instead of relying on an undeclared global", () => {
  const source = readFileSync(
    new URL("../components/place-directory.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /import\s*\{\s*brand\s*\}\s*from\s*"@\/lib\/brand"/);
  assert.match(source, /\{brand\.name\}\s+Community/);
});

test("the private Hojavía preview cannot publish search or legacy presentation signals", () => {
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
  assert.match(resetPassword, /!brand\.isPreview&&<CedrivaMark\/>/);
  assert.match(recommendationEditor, /\$\{brand\.name\}\s+has refreshed this recommendation/);
  assert.match(layout, /themeColor:brand\.isPreview\?"#173A37":"#0f0d0b"/);
  assert.doesNotMatch(layout, /Cedriva is a retired legacy placeholder/);
});
