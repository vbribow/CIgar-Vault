import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { AI_CREDIT_COSTS } from "../lib/ai-credits";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("AI usage costs match the published no-overage policy", () => { assert.deepEqual(AI_CREDIT_COSTS, { "cigar-somm": 1, "exact-research": 5, "valuation-refresh": 5, "deep-research": 10 }); });
test("paid provider routes reserve credits and release failed work", () => { for (const path of ["app/api/cigar-somm/route.ts", "app/api/cigar-research/route.ts"]) { const value = source(path); assert.match(value, /reserveAiCredits/); assert.match(value, /finishAiCreditUsage/); assert.match(value, /status: "failed"/); } });
test("credit and membership limits are atomic and inaccessible to collector clients", () => { const migration = source("supabase/migrations/202608120001_subscription_plans_and_ai_credits.sql"); assert.match(migration, /pg_advisory_xact_lock/); assert.match(migration, /enforce_vault_membership_capacity/); assert.match(migration, /before insert on public\.vault_records/); assert.match(migration, /revoke all on public\.ai_credit_usage from anon, authenticated/); });
test("home and pricing provide an obvious hospitality welcome", () => { const home = source("app/page.tsx"), pricing = source("app/pricing/page.tsx"); assert.match(home, /Create free account/); assert.match(home, />Sign in</); assert.match(pricing, /No surprise overages/); assert.match(pricing, /`Choose \$\{interval\}`/); });
test("pricing plan and economics are archived with an activation boundary", () => { const document = source("SUBSCRIPTION_PRICING_AND_UNIT_ECONOMICS_2026-08-12.md"); assert.match(document, /No deployment, migration application/); assert.match(document, /Adoption forecast/); assert.match(document, /Contribution-margin planning/); });
