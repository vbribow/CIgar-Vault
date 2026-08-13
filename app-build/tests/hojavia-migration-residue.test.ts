import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { siteUrl } from "../lib/seo";
import { referralCookieName } from "../lib/partner-platform";
import { PREVIOUS_RECOVERY_COOLDOWN_KEY, RECOVERY_COOLDOWN_KEY } from "../lib/recovery-cooldown";

test("new public metadata defaults to the canonical Hojavía domain", () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  assert.equal(siteUrl(), "https://hojavia.com");
  if(configured === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = configured;
  if(vercel === undefined) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  else process.env.VERCEL_PROJECT_PRODUCTION_URL = vercel;
});

test("new browser state uses Hojavía keys", () => {
  assert.equal(referralCookieName, "hojavia_partner_referral");
  assert.match(RECOVERY_COOLDOWN_KEY, /^hojavia:/);
  assert.equal(PREVIOUS_RECOVERY_COOLDOWN_KEY, "cigar-vault:recovery-cooldown-v2");
});

test("new inventory backups use Hojavía format and filenames", () => {
  const route = readFileSync(new URL("../app/api/inventory-integrity/backup/route.ts", import.meta.url), "utf8");
  assert.match(route, /hojavia-inventory-backup/);
  assert.match(route, /filename="hojavia-/);
  assert.doesNotMatch(route, /filename="cigar-vault-/);
});
