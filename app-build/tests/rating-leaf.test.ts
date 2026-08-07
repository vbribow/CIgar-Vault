import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the single leaf seal identifies Hojavía numeric ratings without replacing their values", () => {
  const component = source("../components/rating-leaf-mark.tsx");
  assert.match(component, /single leaf identifies an exact numeric rating or ranking owned by Hojavía/);
  assert.match(component, /Published professional and Google ratings keep their source identity/);
  assert.match(component, /Repeated one-to-three leaves are reserved for independent lounge distinctions/);
  assert.match(component, /aria-label=\{`\$\{label\}: \$\{value\}`\}/);
});

test("Collector 25, personal, lounge-community, and verified-retailer ratings use the leaf seal", () => {
  assert.match(source("../app/community/page.tsx"), /RatingLeafMark value="25" label="Collector ranking"/);
  const community = source("../components/community-hub.tsx");
  assert.match(community, /RatingLeafMark value=\{item\.averageScore\} label="Your score"/);
  assert.match(community, /RatingLeafMark value=\{item\.weightedScore\}/);
  assert.match(source("../components/quick-place-rating.tsx"), /RatingLeafMark value=\{choice\.score\}/);
  assert.match(source("../components/place-directory.tsx"), /label="Community score"/);
  assert.match(source("../components/retailer-market.tsx"), /label="Hojavía certified-retailer rating"/);
  assert.match(source("../components/smoking-experience-scorecard.tsx"), /label="Your smoking-log score"/);
  assert.match(source("../app/inventory/\[inventoryId\]/page.tsx"), /label="Personal collection score"/);
});

test("external professional and Google scores remain source-native", () => {
  assert.doesNotMatch(source("../components/rating-research-panel.tsx"), /RatingLeafMark/);
  const places = source("../components/place-directory.tsx");
  assert.match(places, /<span>Google rating<\/span><strong>\{place\.googleRating\?\?"—"\}<\/strong>/);
  assert.match(places, /Google ratings are never converted into \{brand\.name\} ratings/);
});
