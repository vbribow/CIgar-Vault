import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath: string) => readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("home leads with the collector record and three concrete outcomes", () => {
  const home = read("app/page.tsx");
  assert.match(home, /The system of record for your cigar collection/);
  assert.match(home, /Know what you own/);
  assert.match(home, /Understand the record/);
  assert.match(home, /Choose what comes next/);
  assert.match(home, />Open my Vault</);
});

test("Cigar Somm is positioned by collector outcome rather than AI", () => {
  const domains = read("lib/product-domains.ts");
  const dashboard = read("components/dashboard.tsx");
  assert.match(domains, /Choose what to smoke and how to pair it/);
  assert.doesNotMatch(domains, /promise:`[^`]*AI-assisted/);
  assert.match(dashboard, /Cigar Somm · Personal guidance/);
  assert.match(dashboard, /Your taste record/);
});
