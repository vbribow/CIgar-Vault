import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("primary workspace loading routes share one private and evidence-safe experience", async () => {
  const [component, ...routes] = await Promise.all([
    readFile(new URL("components/workspace-loading.tsx", root), "utf8"),
    ...["app/loading.tsx","app/inventory/loading.tsx","app/collections/loading.tsx","app/humidors/loading.tsx","app/records/loading.tsx","app/verification/loading.tsx"]
      .map(path => readFile(new URL(path, root), "utf8")),
  ]);
  assert.match(component, /Private records remain hidden until the complete view is ready/);
  assert.match(component, /role="status"/);
  assert.match(component, /brand\.brandLine/);
  for (const route of routes) assert.match(route, /WorkspaceLoading/);
});

test("offline and update states preserve record boundaries", async () => {
  const [offline, manager, worker] = await Promise.all([
    readFile(new URL("app/offline/page.tsx", root), "utf8"),
    readFile(new URL("components/pwa-manager.tsx", root), "utf8"),
    readFile(new URL("public/sw.js", root), "utf8"),
  ]);
  assert.match(offline, /No stale collection totals are shown/);
  assert.match(offline, /not been classified as empty, missing, or changed/);
  assert.match(manager, /Your private records remain intact/);
  assert.match(worker, /hojavia-beta-shell-v4/);
  assert.doesNotMatch(worker, /\/inventory|\/api\//);
});

test("state and return controls remain touch and keyboard accessible", async () => {
  const styles = await readFile(new URL("app/styles.css", root), "utf8");
  assert.match(styles, /\.emptyState[^}]*min-height:132px/);
  assert.match(styles, /\.detailReturnLink,\.backLink[^}]*min-height:44px/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(styles, /:focus-visible/);
});
