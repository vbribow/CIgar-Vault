import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const journey = readFileSync(new URL("../components/collector-journey.tsx", import.meta.url), "utf8");
const community = readFileSync(new URL("../components/community-hub.tsx", import.meta.url), "utf8");
const nextConfig = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");

test("private loopback and LAN previews permit the Next development client", () => {
  assert.match(nextConfig, /allowedDevOrigins/);
  assert.match(nextConfig, /"127\.0\.0\.1"/);
  assert.match(nextConfig, /"192\.168\.1\.104"/);
});

test("journey stage controls select content without navigating away", () => {
  assert.match(journey, /role="tablist"/);
  assert.match(journey, /stages\.map\(item=><button type="button" role="tab"/);
  assert.match(journey, /aria-controls="collector-journey-panel"/);
  assert.match(journey, /id="collector-journey-panel" role="tabpanel" aria-labelledby=/);
  assert.doesNotMatch(journey, /stages\.map\(item=><Link/);
});

test("the Connoisseur actions open the intended community workspaces", () => {
  assert.match(journey, /\/community\?journey=connoisseur&tab=board#recent-discussions/);
  assert.match(journey, /\/community\?journey=connoisseur&tab=ratings#rate-a-cigar/);
  assert.match(community, />Message board<\/button>/);
});

test("every journey action points to an implemented app route", () => {
  const hrefs = [...journey.matchAll(/\["(\/[^"]+)","[^"]+"\]/g)].map(match => match[1]);
  assert.equal(hrefs.length, 12);
  for (const href of hrefs) {
    const pathname = href.split(/[?#]/)[0];
    assert.ok(
      existsSync(new URL(`../app${pathname}/page.tsx`, import.meta.url)),
      `Missing journey destination: ${pathname}`,
    );
  }
});
