import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { AccountExportSchema, buildRecoveryPreview, recordsForRecovery } from "../lib/account-recovery";
import { buildAccountExport, accountSecuritySummary, type AccountVaultRecord } from "../lib/account-security";
import { buildCigarSommCollectorContext } from "../lib/cigar-somm-context";
import { buildCigarStory, cigarStoryId } from "../lib/cigar-story";
import { buildInsurancePdfDocument } from "../lib/insurance-pdf";
import { buildInsuranceReport } from "../lib/insurance-report";
import { normalizeInventory } from "../lib/inventory-model";
import { findInventoryDuplicates } from "../lib/photo-intake";
import { validatePhotoSelection } from "../lib/photo-capture";
import { universalSearch } from "../lib/universal-search";
import { isVerifiedCompletedSale } from "../lib/valuation-evidence";
import type { CigarCollection, InventoryItem, Valuation } from "../lib/types";

const createdAt = "2026-07-27T18:00:00.000Z";
const testOwner = "qa-local-tenant";
const photoFixtures = [
  { name: "cigar.jpg", type: "image/jpeg", bytes: Buffer.from("/9j/4AAQSkZJRgABAQ==", "base64") },
  { name: "band.png", type: "image/png", bytes: Buffer.from("iVBORw0KGgoAAAANSUhEUg==", "base64") },
  { name: "box.webp", type: "image/webp", bytes: Buffer.from("UklGRgAAAABXRUJQVlA4", "base64") },
  { name: "box-code.jpg", type: "image/jpeg", bytes: Buffer.from("/9j/4AAQSkZJRgABAQ==", "base64") },
  { name: "receipt.png", type: "image/png", bytes: Buffer.from("iVBORw0KGgoAAAANSUhEUg==", "base64") },
];

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const checksum = (value: unknown) => createHash("sha256").update(stable(value)).digest("hex");

test("isolated Hojavía beta lifecycle preserves one exact lot through backup, restore, and cleanup", async () => {
  const started = performance.now();
  const directory = await mkdtemp(path.join(tmpdir(), "hojavia-beta-lifecycle-"));
  try {
    const assetChecksums = new Map<string, string>();
    for (const fixture of photoFixtures) {
      const target = path.join(directory, fixture.name);
      await writeFile(target, fixture.bytes);
      assetChecksums.set(fixture.name, createHash("sha256").update(await readFile(target)).digest("hex"));
    }
    assert.equal(assetChecksums.size, 5);
    assert.equal(
      validatePhotoSelection([], photoFixtures.map(item => ({ name: item.name, type: item.type, size: item.bytes.length }))),
      null,
    );

    const visionProposal = {
      brand: "Hojavía QA",
      line: "Lifecycle Reserve",
      vitola: "Toro (6 × 52)",
      vintage: "2026",
      dimensions: "6 × 52",
      packaging: "Box of 10",
      fullBoxQty: 1,
      sticksPerBox: 10,
      looseStickQty: 0,
      boxCode: "QA JUL 26",
      confidence: "high",
      evidenceSummary: "Controlled band, box label, box code, and receipt fixtures agree.",
      uncertainties: [] as string[],
    };
    assert.equal(visionProposal.confidence, "high");
    assert.deepEqual(visionProposal.uncertainties, []);

    const inventory = normalizeInventory({
      inventoryId: "INV-QA-LIFECYCLE-001",
      brand: visionProposal.brand,
      line: visionProposal.line,
      vitola: visionProposal.vitola,
      vintage: visionProposal.vintage,
      fullBoxQty: visionProposal.fullBoxQty,
      sticksPerBox: visionProposal.sticksPerBox,
      looseStickQty: visionProposal.looseStickQty,
      smokedQty: 0,
      packaging: visionProposal.packaging,
      boxCode: visionProposal.boxCode,
      storageLocationId: "HUM-QA-001",
      photoLink: "private://qa-local-tenant/cigar.jpg",
      boxPhotoLink: "private://qa-local-tenant/box.webp",
      boxCodePhotoLink: "private://qa-local-tenant/box-code.jpg",
      provenanceDocumentLink: "private://qa-local-tenant/receipt.png",
      provenanceNotes: `Controlled beta fixture checksums: ${[...assetChecksums.values()].join(",")}`,
      retailValue: 42,
      status: "Hold",
      priority: "Medium",
    });
    assert.equal(inventory.currentQty, 10);
    assert.equal(findInventoryDuplicates(inventory, []).length, 0);
    assert.equal(findInventoryDuplicates(inventory, [inventory])[0]?.score, 100);

    const presentation: InventoryItem = {
      inventoryId: "INV-QA-PRESENTATION-001",
      brand: "Hojavía QA",
      line: "Lifecycle Reserve Presentation",
      vitola: "Presentation humidor",
      vintage: "2026",
      currentQty: 1,
      originalQty: 1,
      smokedQty: 0,
      status: "Hold",
    };
    const collection: CigarCollection = {
      collectionId: "COL-QA-001",
      name: "Lifecycle Reserve Presentation",
      maker: "Hojavía QA",
      releaseYear: 2026,
      expectedComponents: 0,
      expectedCigars: 0,
      presentationInventoryId: presentation.inventoryId,
      status: "Complete",
    };
    assert.equal(inventory.collectionId, undefined);
    assert.notEqual(collection.presentationInventoryId, inventory.inventoryId);

    const valuations: Valuation[] = [
      {
        valuationId: "VAL-QA-RETAIL",
        inventoryId: inventory.inventoryId,
        valuationDate: "2026-07-27",
        replacementValue: 42,
        source: "Controlled retail fixture",
        sourceUrl: "https://example.test/retail",
        confidence: "High",
      },
      {
        valuationId: "VAL-QA-ASKING",
        inventoryId: inventory.inventoryId,
        valuationDate: "2026-07-27",
        askingPrice: 55,
        askingPriceSource: "Controlled listing fixture",
        askingPriceSourceUrl: "https://example.test/asking",
        marketEvidenceType: "Observed asking price",
      },
      {
        valuationId: "VAL-QA-SALE",
        inventoryId: inventory.inventoryId,
        valuationDate: "2026-07-26",
        lastSaleValue: 48,
        lastSaleDate: "2026-07-25",
        lastSaleVenue: "Controlled auction fixture",
        lastSaleSourceUrl: "https://example.test/sold-lot",
        marketEvidenceType: "Verified completed sale",
      },
    ];
    assert.equal(isVerifiedCompletedSale(valuations[1]), false);
    assert.equal(isVerifiedCompletedSale(valuations[2]), true);

    const story = buildCigarStory({
      identityId: cigarStoryId(inventory),
      inventory: [inventory, presentation],
      valuations,
      smokes: [],
      ratings: [],
      collections: [collection],
    });
    assert.equal(story?.lots.length, 1);
    assert.equal(story?.completedSale?.valuationId, "VAL-QA-SALE");

    const somm = buildCigarSommCollectorContext({
      inventory: [inventory],
      smokes: [],
      valuations,
      collections: [],
      selectedInventoryId: inventory.inventoryId,
      humidors: [{
        humidorId: "HUM-QA-001",
        name: "QA humidor",
        targetTempF: 68,
        minTempF: 65,
        maxTempF: 72,
        targetHumidity: 67,
        minHumidity: 63,
        maxHumidity: 70,
      }],
    });
    assert.equal(somm.privacy, "Private summary for this signed-in collector");
    assert.equal(somm.selectedCigar?.ownedQuantity, 10);

    const search = universalSearch("Lifecycle Reserve", {
      inventory: [inventory],
      collections: [collection],
      valuations,
      wishlist: [],
    });
    assert.ok(search.some(item => item.href === `/inventory/${inventory.inventoryId}`));

    const report = buildInsuranceReport([inventory], [], [], [], new Date(createdAt));
    assert.equal(report.totals.lots, 1);
    assert.equal(report.totals.knownQuantity, 10);
    assert.equal(report.totals.scheduledReplacementValue, 420);
    const pdf = buildInsurancePdfDocument({ rows: report.rows, valuations, generatedAt: createdAt, totals: report.totals });
    const pdfText = Buffer.from(pdf).toString("latin1");
    assert.match(pdfText, /HOJAVIA - PRIVATE INSURANCE SCHEDULE/);
    assert.equal(pdfText.toLowerCase().includes(["ced", "riva"].join("")), false);
    assert.match(pdfText, /Market asking price - no confirmed sale/);
    assert.match(pdfText, /Verified completed sale/);

    const sourceRecords: AccountVaultRecord[] = [
      { kind: "inventory", record_id: inventory.inventoryId, payload: inventory, updated_at: createdAt },
      { kind: "inventory", record_id: presentation.inventoryId, payload: presentation, updated_at: createdAt },
      { kind: "collections", record_id: collection.collectionId, payload: collection, updated_at: createdAt },
      ...valuations.map(value => ({ kind: "valuations", record_id: value.valuationId, payload: value, updated_at: createdAt })),
      {
        kind: "integrity",
        record_id: "BACKUP-QA-001",
        payload: { action: "inventory-backup", createdAt, recordCount: 6 },
        updated_at: createdAt,
      },
    ];
    const exported = buildAccountExport({
      userId: testOwner,
      email: "qa-local@example.test",
      profile: { displayName: "Automated local QA tenant" },
      preferences: {},
      records: sourceRecords,
      createdAt,
    });
    assert.equal(AccountExportSchema.parse(exported).recordCount, sourceRecords.length);
    const backupChecksum = checksum(exported.records);
    assert.equal(accountSecuritySummary(sourceRecords).lastBackupAt, createdAt);

    const cleanTarget: AccountVaultRecord[] = [];
    const preview = buildRecoveryPreview(exported.records, cleanTarget);
    assert.equal(preview.missing, sourceRecords.length);
    const restored = recordsForRecovery(exported.records, cleanTarget, "missing");
    assert.equal(restored.length, sourceRecords.length);
    assert.equal(checksum(restored), backupChecksum);
    assert.equal(buildRecoveryPreview(exported.records, restored).identical, sourceRecords.length);

    const retry = recordsForRecovery(exported.records, restored, "missing");
    assert.deepEqual(retry, []);
    const partialFailureTarget = restored.filter(record => record.record_id !== "VAL-QA-SALE");
    assert.equal(buildRecoveryPreview(exported.records, partialFailureTarget).missing, 1);
    assert.equal(recordsForRecovery(exported.records, partialFailureTarget, "missing").length, 1);

    restored.splice(0, restored.length);
    assert.equal(restored.length, 0);
    await rm(directory, { recursive: true });
    assert.ok(performance.now() - started < 5_000);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
