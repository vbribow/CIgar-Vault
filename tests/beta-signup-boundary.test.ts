import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { safeAuthNext } from "../lib/auth-navigation";
import { normalizeBetaEmail } from "../lib/beta-access";

test("invited-email matching is normalized without broad wildcard matching", () => {
  assert.equal(normalizeBetaEmail("  Collector@Example.COM "), "collector@example.com");
  const access = readFileSync(new URL("../lib/beta-access.ts", import.meta.url), "utf8");
  assert.match(access, /\.eq\("email", normalizeBetaEmail\(email\)\)/);
  assert.doesNotMatch(access, /\.ilike\(/);
});

test("authentication redirects accept only same-origin paths", () => {
  assert.equal(safeAuthNext("/inventory?tab=owned#top"), "/inventory?tab=owned#top");
  assert.equal(safeAuthNext("https://attacker.example"), "/");
  assert.equal(safeAuthNext("//attacker.example"), "/");
  assert.equal(safeAuthNext("/\\attacker.example"), "/");
  assert.equal(safeAuthNext(null), "/");
});

test("new signup metadata uses Hojavía consent while the trigger retains legacy compatibility", () => {
  const actions = readFileSync(new URL("../app/login/actions.ts", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../supabase/migrations/202607290003_hojavia_signup_consent.sql", import.meta.url), "utf8");
  assert.match(actions, /hojavia_consent_version/);
  assert.doesNotMatch(actions, /cedriva_consent_version/);
  assert.match(migration, /hojavia_consent_version/);
  assert.match(migration, /cedriva_consent_version/);
  assert.match(migration, /revoke execute .* from anon/);
  assert.match(migration, /revoke execute .* from authenticated/);
});
