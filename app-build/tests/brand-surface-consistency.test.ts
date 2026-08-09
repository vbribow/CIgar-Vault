import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("share and install surfaces carry the current Hojavía identity", async () => {
  const [layout, manifest, socialCard] = await Promise.all([
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/manifest.ts", root), "utf8"),
    readFile(new URL("public/og-hojavia.svg", root), "utf8"),
  ]);

  assert.match(layout, /width:1200,height:630/);
  assert.match(layout, /brand\.spokenName/);
  assert.match(manifest, /shortcuts/);
  assert.match(manifest, /My collection/);
  assert.match(manifest, /Discover cigars/);
  assert.match(manifest, /Continue a premium cigar learning pathway/);
  assert.match(socialCard, /HOJAVÍA/);
  assert.match(socialCard, /Knowledge carried forward/);
  assert.doesNotMatch(socialCard, /CEDRIVA/i);
});

test("collector-facing guidance uses one transparent AI-assisted label", async () => {
  const files = await Promise.all([
    "app/cigar-somm/page.tsx",
    "components/cigar-somm.tsx",
    "components/collector-command-center.tsx",
    "components/dashboard.tsx",
    "app/learn/foundations/page.tsx",
    "app/learn/page.tsx",
    "app/data-model/page.tsx",
    "lib/product-domains.ts",
  ].map(path => readFile(new URL(path, root), "utf8")));
  const combined = files.join("\n");

  assert.match(combined, /Cigar Somm · AI-assisted/);
  assert.doesNotMatch(combined, /Hojavía AI/);
  assert.doesNotMatch(combined, /brand\.name} AI/);
  assert.doesNotMatch(combined, /Powered by .* AI/);
});

test("practice calls to action and disclosures use welcoming collector language", async () => {
  const [dashboard, verification, walkthrough] = await Promise.all([
    readFile(new URL("components/dashboard.tsx", root), "utf8"),
    readFile(new URL("app/verification/page.tsx", root), "utf8"),
    readFile(new URL("components/collector-walkthrough.tsx", root), "utf8"),
  ]);

  assert.match(dashboard, /Practice with a safe example/);
  assert.match(verification, /Practice with a safe example/);
  assert.match(walkthrough, /Practice example only/);
  assert.match(walkthrough, /No real box or cigar is involved/);
});
