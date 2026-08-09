import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("task continuity stores only an allowlisted workspace and generic label", () => {
  const component = read("components/task-continuity.tsx");
  assert.match(component, /hojavia:last-safe-task:v1/);
  assert.match(component, /safeTasks\.some/);
  assert.match(component, /never cigar details or private record contents/i);
  assert.doesNotMatch(component, /searchParams|inventoryId|recordId/);
});

test("Vault return continuity preserves filters, loaded count, and position for this tab", () => {
  const manager = read("components/inventory-manager.tsx");
  assert.match(manager, /hojavia:vault-view:v1/);
  assert.match(manager, /window\.sessionStorage\.setItem/);
  assert.match(manager, /visibleLimit, scrollY: window\.scrollY/);
  assert.match(manager, /saved\.href !== `\$\{window\.location\.pathname\}\$\{window\.location\.search\}`/);
});

test("core searches, identification, and saves use bounded requests and stale guards", () => {
  const helper = read("lib/request-control.ts");
  const search = read("components/global-search.tsx");
  const intake = read("components/photo-inventory-intake.tsx");
  const records = read("components/records-manager.tsx");
  assert.match(helper, /class RequestTimeoutError/);
  assert.match(helper, /new AbortController/);
  assert.match(search, /fetchWithTimeout/);
  assert.match(intake, /identificationRequest\.current/);
  assert.match(records, /smokePhotoRequest\.current/);
});

test("catalog, camera code, and published ratings load only after collector intent", () => {
  const page = read("app/inventory/page.tsx");
  const manager = read("components/inventory-manager.tsx");
  const route = read("app/api/inventory/support/route.ts");
  assert.doesNotMatch(page, /loadCatalog|loadRatings/);
  assert.match(page, /catalog=\{\[\]\} ratings=\{\[\]\}/);
  assert.match(manager, /photoIntakeOpen\?<PhotoInventoryIntake/);
  assert.match(manager, /Open camera documentation/);
  assert.match(manager, /Load published ratings/);
  assert.match(route, /kind === "catalog"/);
  assert.match(route, /kind === "ratings"/);
});
