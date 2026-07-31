import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (relativePath: string) => readFileSync(new URL(relativePath, root), "utf8");
const asset = (relativePath: string) => new URL(relativePath, root);

test("the active editorial hero stays within the local transfer budget", () => {
  const hero = asset("public/editorial/cigar-roller-hojavia.jpg");
  assert.ok(existsSync(hero), "the optimized Hojavía hero must exist");
  assert.ok(statSync(hero).size <= 425 * 1024, "the active hero must remain at or below 425 KiB");
  assert.equal(existsSync(asset("public/editorial/cigar-roller-hojavia.png")), false);
  assert.equal(existsSync(asset("public/editorial/cigar-roller-cedriva.png")), false);
});

test("high-value pages reserve image space and defer below-fold work", () => {
  const home = read("app/page.tsx");
  const manifesto = read("app/manifesto/page.tsx");
  const discover = read("app/discover/page.tsx");

  assert.match(home, /cigar-roller-hojavia\.jpg"\} width="1540" height="1021" fetchPriority="high" decoding="async"/);
  assert.match(manifesto, /cigar-roller-hojavia\.jpg"\} width="1540" height="1021"[^>]*fetchPriority="high"[^>]*decoding="async"/);
  assert.match(discover, /tobacco-field\.jpg" width="1800" height="1013" decoding="async"/);
  assert.match(discover, /tobacco-field\.jpg" width="1800" height="1013" loading="lazy" decoding="async"/);
  assert.doesNotMatch(`${home}${manifesto}${discover}`, /cigar-roller-(?:hojavia|cedriva)\.png/);
});

test("slow private workspaces provide stable, accessible loading states", () => {
  for (const route of ["app/loading.tsx", "app/inventory/loading.tsx", "app/humidors/loading.tsx", "app/records/loading.tsx", "app/verification/loading.tsx"]) {
    const loading = read(route);
    assert.match(loading, /aria-busy="true"/, `${route} must announce that it is busy`);
    assert.match(loading, /role="status"/, `${route} must provide a readable loading status`);
    assert.match(loading, /skeleton/, `${route} must reserve meaningful layout space`);
  }
});
