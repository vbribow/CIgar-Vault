import assert from "node:assert/strict";
import test from "node:test";
import { manufacturingFactories, manufacturingRegions, manufacturingTruthHrefForHouse, manufacturingTruthRecords } from "../lib/manufacturing-truth";

test("manufacturing truth records separate ownership, authorship, factories, and evidence", () => {
  assert.equal(manufacturingTruthRecords.length, 21);
  assert.equal(new Set(manufacturingTruthRecords.map((record) => record.id)).size, manufacturingTruthRecords.length);
  for (const record of manufacturingTruthRecords) {
    assert.ok(record.brand);
    assert.ok(record.owner);
    assert.ok(record.blender);
    assert.ok(record.factories.length);
    assert.ok(record.factoryCountries.length);
    assert.ok(record.tobaccoRegions.length);
    assert.ok(record.releaseRule);
    assert.ok(record.history);
    assert.match(record.sourceUrl, /^https:\/\//);
    assert.match(record.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(["Official", "Verified Historical"].includes(record.trustLevel));
    assert.ok(["High", "Medium"].includes(record.confidence));
  }
});

test("the first directory represents major owned, partner, mixed, and contract systems", () => {
  for (const relationship of ["Vertically integrated", "Company-owned factory", "Partner-owned factory", "Directed contract production", "Mixed production"]) {
    assert.ok(manufacturingTruthRecords.some((record) => record.relationship === relationship));
  }
  for (const id of ["my-father", "arturo-fuente", "perdomo", "espinosa", "aj-fernandez", "dunbarton", "warped", "manufactura-rivas", "plasencia", "foundation", "tatuaje", "illusione", "ovejanegracigars", "crowned-heads"]) {
    assert.ok(manufacturingTruthRecords.some((record) => record.id === id));
  }
});

test("factory and regional learning connect back to evidence records", () => {
  assert.ok(manufacturingFactories.length >= 12);
  assert.ok(manufacturingRegions.length >= 6);
  const recordIds = new Set(manufacturingTruthRecords.map((record) => record.id));
  for (const factory of manufacturingFactories) assert.ok(recordIds.has(factory.record));
  assert.equal(manufacturingTruthHrefForHouse("Manufactura Rivas · Dominican Republic"), "/learn/manufacturing-truth#manufactura-rivas");
  assert.equal(manufacturingTruthHrefForHouse("Unknown future house"), "/learn/manufacturing-truth");
});
