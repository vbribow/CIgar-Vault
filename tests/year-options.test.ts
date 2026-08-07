import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { recentYearOptions } from "../lib/year-options";

test("release-year choices include the current year and prior 15 years", () => {
  const years = recentYearOptions(undefined, 2026);
  assert.equal(years.length, 16);
  assert.deepEqual(years, [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011]);
});

test("an older documented saved year remains editable without expanding the normal list", () => {
  const years = recentYearOptions("1998", 2026);
  assert.equal(years.length, 17);
  assert.ok(years.includes(1998));
  assert.equal(years[0], 2026);
});

test("invalid and future values are never offered as documented years", () => {
  assert.equal(recentYearOptions("unknown", 2026).length, 16);
  assert.equal(recentYearOptions(2027, 2026).includes(2027), false);
});

test("collector-facing release-year entry uses the shared documented-year dropdown", () => {
  const componentFiles = [
    "recommendation-fact-editor.tsx",
    "inventory-manager.tsx",
    "collections-manager.tsx",
    "wishlist-purchase-intake.tsx",
    "photo-inventory-intake.tsx",
    "community-hub.tsx",
    "catalog-discovery-review.tsx",
  ];

  for (const file of componentFiles) {
    const source = readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8");
    assert.match(source, /recentYearOptions/, `${file} should use the shared year options`);
  }
});
