import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("heavy Vault tools are split from the initial manager experience", () => {
  const manager = read("components/inventory-manager.tsx");
  assert.match(manager, /dynamic\([\s\S]*photo-inventory-intake/);
  assert.match(manager, /dynamic\([\s\S]*inventory-correction-assistant/);
  assert.match(manager, /dynamic\([\s\S]*photo-manager/);
  assert.match(manager, /Preparing camera documentation/);
});

test("core home journeys use prefetched client transitions", () => {
  const home = read("app/page.tsx");
  assert.match(home, /<Link className="button" href="\/login\?mode=signup">Create free account<\/Link>/);
  assert.match(home, /<Link className="button secondary" href="\/login">Sign in<\/Link>/);
  assert.match(home, /href="\/collector-walkthrough" prefetch/);
  assert.match(home, /href="\/discover" prefetch/);
});

test("connection interruptions remain explicit and evidence safe", () => {
  const status = read("components/connection-status.tsx");
  const layout = read("app/layout.tsx");
  assert.match(status, /window\.addEventListener\("offline"/);
  assert.match(status, /Nothing is being treated as missing or changed/);
  assert.match(status, /aria-live="assertive"/);
  assert.match(layout, /<ConnectionStatus\/>/);
});

test("mobile keyboard and safe-area budgets remain present", () => {
  const styles = read("app/styles.css");
  assert.match(styles, /scroll-padding-bottom:120px/);
  assert.match(styles, /bottom:calc\(86px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(styles, /scroll-margin-bottom:170px/);
});

test("repeated production builds stamp the installed app from its source template", () => {
  const build = read("scripts/build-app.mjs");
  assert.match(build, /const workerTemplatePath = resolve\("public\/sw\.js"\)/);
  assert.match(build, /workerTemplate\.replaceAll\(releaseMarker, release\)/);
  assert.doesNotMatch(build, /worker\.replaceAll\(releaseMarker, release\)/);
});

test("the homepage streams the complete-evidence dashboard behind immediate collector content", () => {
  const home = read("app/page.tsx");
  assert.match(home, /async function PrivateDashboard\(\)/);
  assert.match(home, /function HomeIntroduction\(\)/);
  assert.match(home, /<HomeIntroduction\/><Suspense fallback=\{<DashboardLoading\/>\}><PrivateDashboard\/><\/Suspense>/);
  assert.match(home, /Partial evidence is never presented as a complete dashboard/);
});

test("search and installation support load on interaction or browser idle time", () => {
  const navigation = read("components/app-navigation.tsx");
  const deferredSearch = read("components/deferred-global-search.tsx");
  const layout = read("app/layout.tsx");
  const deferredPwa = read("components/deferred-pwa-manager.tsx");
  assert.match(navigation, /<DeferredGlobalSearch\/>/);
  assert.match(deferredSearch, /requestIdleCallback/);
  assert.match(deferredSearch, /hojavia:open-search/);
  assert.match(layout, /<DeferredPwaManager\/>/);
  assert.match(deferredPwa, /beforeinstallprompt/);
  assert.match(deferredPwa, /requestIdleCallback/);
});

test("the Vault avoids unused catalog and rating reads and renders long result sets incrementally", () => {
  const page = read("app/inventory/page.tsx");
  const manager = read("components/inventory-manager.tsx");
  assert.doesNotMatch(page, /loadCatalog|loadRatings/);
  assert.match(page, /<Suspense fallback=\{null\}><InventoryUpgradeNudge/);
  assert.match(manager, /useDeferredValue\(query\)/);
  assert.match(manager, /filtered\.slice\(0, visibleLimit\)/);
  assert.match(manager, /Show \{Math\.min\(inventoryBatchSize/);
  assert.match(manager, /releaseLotIssuesById/);
  assert.match(manager, /photoIntakeOpen\?<PhotoInventoryIntake/);
});
