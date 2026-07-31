import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath: string) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("collector-facing language explains outcomes without platform jargon", () => {
  const walkthrough = read("components/collector-walkthrough.tsx");
  const walkthroughPage = read("app/collector-walkthrough/page.tsx");
  const catalogFields = read("components/catalog-fields.tsx");
  const sensors = read("app/sensors/page.tsx");
  const catalog = read("app/catalog/page.tsx");
  const discovery = read("app/catalog-discovery/page.tsx");
  const reports = read("app/reports/page.tsx");
  const storage = read("app/storage/page.tsx");
  const intake = read("components/photo-inventory-intake.tsx");

  assert.match(walkthrough, /Say only what the records support/);
  assert.match(walkthrough, /What the records support/);
  assert.match(walkthroughPage, /Synthetic example · nothing saved · nothing submitted/);
  assert.match(catalogFields, /standardized brand names/);
  assert.match(catalogFields, /documented catalog line/);
  assert.match(sensors, /Your humidor climate, together\./);
  assert.match(catalog, /Consistent names protect history/);
  assert.match(catalog, /one trusted record/);
  assert.match(discovery, /Active cigar research brief/);
  assert.match(discovery, /Return to cigar record/);
  assert.match(reports, /Hojavía could not safely load your complete collection/);
  assert.match(storage, /Hojavía could not safely load your complete collection/);
  assert.match(intake, /Saved review queue/);

  for (const source of [walkthrough, walkthroughPage, reports, storage, intake]) {
    assert.doesNotMatch(source, /Evidence state|authoritative inventory|Durable review queue/);
  }
});

test("mobile and keyboard safeguards remain part of the platinum experience", () => {
  const styles = read("app/styles.css");

  assert.match(styles, /\.mobileNav a\{[^}]*min-height:49px/);
  assert.match(styles, /@media\(max-width:700px\)[\s\S]*?input,select,textarea\{min-height:46px;font-size:16px\}/);
  assert.match(styles, /@media\(max-width:700px\)[\s\S]*?\.button,button\{min-height:44px\}/);
  assert.match(styles, /:where\(a,button,input,select,textarea,summary\):focus-visible\{outline:3px solid #f0c979/);
  assert.match(styles, /\.walkthroughStage>header h2\{scroll-margin-top:110px\}/);
});
