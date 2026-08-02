import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(path, "utf8");

test("every collector workspace has a reserved loading experience", () => {
  const sharedLoading = read("components/workspace-loading.tsx");
  assert.match(sharedLoading, /aria-busy="true"/, "shared loading state announces its busy state");
  assert.match(sharedLoading, /role="status"/, "shared loading state announces progress");
  for (const route of ["inventory", "humidors", "records", "verification", "collections"]) {
    const loading = read(`app/${route}/loading.tsx`);
    assert.match(loading, /WorkspaceLoading/, `${route} uses the shared accessible loading state`);
  }
});

test("core evidence workspaces protect partial data and offer recovery", () => {
  for (const route of ["humidors", "records", "verification", "collections"]) {
    const page = read(`app/${route}/page.tsx`);
    assert.match(page, /role="alert"/, `${route} announces an unavailable workspace`);
    assert.match(page, />Try again</, `${route} offers a direct retry`);
  }

  const inventory = read("app/inventory/page.tsx");
  assert.match(inventory, /Inventory records protected/);
  assert.match(inventory, />Try again</);
});

test("unexpected and missing destinations provide safe next actions", () => {
  const error = read("app/error.tsx");
  const notFound = read("app/not-found.tsx");
  assert.match(error, /role="alert"/);
  assert.match(error, /onClick=\{reset\}/);
  assert.match(error, /Nothing has\s+been classified as missing, deleted, or complete/);
  assert.match(notFound, /Open my collection/);
  assert.match(notFound, /has not inferred anything about your collection/);
});

test("the Culture Promise is a permanent, navigable part of the collector home", () => {
  const home = read("app/page.tsx");
  const promise = read("components/culture-promise.tsx");
  assert.match(home, /<CulturePromise\/>/);
  assert.match(promise, /aria-labelledby="culture-promise-heading"/);
  for (const path of ["/learn/seed-to-smoke", "/learn/manufacturing-truth", "/community", "/legacy"]) {
    assert.match(promise, new RegExp(`href:"${path}"`));
  }
});
