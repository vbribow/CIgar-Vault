import assert from "node:assert/strict";
import test from "node:test";
import { buildSmokingExperienceScorecards, smokingScorecardSommContext } from "../lib/smoking-scorecard";
import type { InventoryItem, SmokingLog } from "../lib/types";

const lot = (inventoryId: string, vitola = "Robusto", vintage: string | number = 2025): InventoryItem => ({ inventoryId, brand: "Example", line: "Reserva", vitola, vintage });
const smoke = (smokeId: string, inventoryId: string, dateSmoked: string, extra: Partial<SmokingLog> = {}): SmokingLog => ({ smokeId, inventoryId, dateSmoked, ...extra });

test("scorecard uses not-rated semantics for zero experiences and never invents zero", () => {
    const result = buildSmokingExperienceScorecards(lot("A"), [lot("A")], []).lot;
    assert.deepEqual(result.overall, { average: undefined, count: 0 });
    assert.match(smokingScorecardSommContext(result).uncertainty, /No smoking/);
});

test("scorecard labels one experience without claiming a trend", () => {
    const result = buildSmokingExperienceScorecards(lot("A"), [lot("A")], [smoke("S1", "A", "2026-01-01", { overall: 91, construction: "Good", burn: "Minor touch-up", buyAgain: true })]).lot;
    assert.deepEqual(result.overall, { average: 91, count: 1 });
    assert.equal(result.construction.trend, undefined);
    assert.deepEqual(result.buyAgain, { yes: 1, count: 1, rate: 100 });
});

test("scorecard aggregates exact identities and isolates nearby vitolas and years", () => {
    const inventory = [lot("A"), lot("B"), lot("C", "Toro"), lot("D", "Robusto", 2024)];
    const smokes = [
      smoke("S1", "A", "2026-01-01", { overall: 90, flavor: "Cedar, Coffee", strength: "Medium", construction: "Good", burn: "Minor touch-up", buyAgain: true }),
      smoke("S2", "B", "2026-02-01", { overall: 94, flavor: "Cedar, Cocoa", strength: "Medium–full", construction: "Excellent", burn: "Even throughout", buyAgain: false }),
      smoke("S3", "C", "2026-03-01", { overall: 10 }),
      smoke("S4", "D", "2026-04-01", { overall: 20 }),
    ];
    const result = buildSmokingExperienceScorecards(inventory[0], inventory, smokes);
    assert.equal(result.identity?.experienceCount, 2);
    assert.deepEqual(result.identity?.overall, { average: 92, count: 2 });
    assert.deepEqual(result.identity?.flavors[0], { label: "Cedar", count: 2 });
    assert.deepEqual(result.identity?.buyAgain, { yes: 1, count: 2, rate: 50 });
    assert.equal(result.identity?.construction.trend?.label, "Improving");
});

test("scorecard keeps incomplete identities lot-only", () => {
    const item = lot("A", "Unknown");
    assert.equal(buildSmokingExperienceScorecards(item, [item, { ...item, inventoryId: "B" }], []).identity, undefined);
});
