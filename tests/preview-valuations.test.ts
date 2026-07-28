import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadPreviewValuations, savePreviewValuation } from "../lib/preview-valuations";
import type { Valuation } from "../lib/types";

const valuation: Valuation = {
  valuationId: "VAL-TAUROS-20260727",
  inventoryId: "INV-0029",
  valuationDate: "2026-07-27",
  replacementValue: 75,
  replacementSticksPerBox: 10,
  marketEvidenceType: "Insufficient evidence",
  source: "Exact-identity established-retailer listing",
  sourceUrl: "https://example.com/tauros",
  confidence: "Medium",
};

test("private preview valuations persist and identical retries are idempotent", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "hojavia-preview-valuations-"));
  const filePath = path.join(directory, "valuations.json");

  assert.equal(await savePreviewValuation(valuation, filePath), false);
  assert.equal(await savePreviewValuation(valuation, filePath), true);
  assert.deepEqual(await loadPreviewValuations(filePath), [valuation]);
});

test("a reused preview valuation ID cannot overwrite different evidence", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "hojavia-preview-valuations-"));
  const filePath = path.join(directory, "valuations.json");
  await savePreviewValuation(valuation, filePath);

  await assert.rejects(
    savePreviewValuation({ ...valuation, replacementValue: 100 }, filePath),
    /already used for different evidence/,
  );
});
