import assert from "node:assert/strict";
import test from "node:test";
import {
  hasMixedCollectionAllocation,
  valuationIntegrityIssues,
} from "../lib/valuation-integrity";

test("blocks a whole collection price allocated to one component", () => {
  const evidence = {
    replacementValue: 500,
    source: "La Gran Fumada complete 13-cigar collection",
    sourceUrl: "https://example.com/la-gran-fumada-box-of-13",
    notes: "Box price normalized per cigar.",
  };
  assert.equal(hasMixedCollectionAllocation(evidence), true);
  assert.equal(
    valuationIntegrityIssues({ collectionId:"COL-GRAN-FUMADA" }, evidence).length,
    1,
  );
});

test("blocks a sampler allocation even when the normalized price looks plausible", () => {
  const evidence = {
    replacementValue: 39.5,
    source: "Father and Son 10-cigar sampler",
    sourceUrl: "https://example.com/father-and-his-son-sampler",
    notes: "Complete sampler price divided across the included cigars.",
  };
  assert.equal(valuationIntegrityIssues({ collectionId:"COL-FATHER-SON" }, evidence).length, 1);
});

test("allows a uniform exact-cigar box normalized per cigar", () => {
  const evidence = {
    replacementValue: 22,
    source: "Exact OpusX Lost City Toro box of 20",
    sourceUrl: "https://example.com/opusx-lost-city-toro",
    notes: "Exact same-cigar box price normalized per cigar.",
  };
  assert.equal(hasMixedCollectionAllocation(evidence), false);
  assert.deepEqual(valuationIntegrityIssues({ collectionId:"COL-DREAM" }, evidence), []);
});

test("does not interfere with manual standalone valuations", () => {
  const evidence = {
    replacementValue: 18,
    source: "Collector receipt",
    notes: "Exact individual cigar purchase.",
  };
  assert.deepEqual(valuationIntegrityIssues({}, evidence), []);
});
