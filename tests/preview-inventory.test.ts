import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  isPrivateInventoryPreviewRequest,
  loadPreviewInventoryOverrides,
  savePreviewInventoryOverride,
  savePreviewInventoryOverrides,
} from "../lib/preview-inventory";
import type { InventoryItem } from "../lib/types";

const item: InventoryItem = {
  inventoryId: "INV-0029",
  brand: "Arturo Fuente",
  line: "OpusX",
  vitola: "Tauros the Bull Maduro",
  provenanceNotes: "A collector-authored story.",
};

test("private same-origin previews may use local inventory persistence", () => {
  const request = new Request("http://127.0.0.1:3102/api/inventory/INV-0029", {
    headers: {
      host: "127.0.0.1:3102",
      origin: "http://127.0.0.1:3102",
      "sec-fetch-site": "same-origin",
    },
  });
  assert.equal(isPrivateInventoryPreviewRequest(request, "development"), true);
  assert.equal(isPrivateInventoryPreviewRequest(request, "production"), false);
});

test("public hosts and cross-origin requests cannot use local preview persistence", () => {
  const publicRequest = new Request("https://example.com/api/inventory/INV-0029");
  const crossOriginRequest = new Request("http://127.0.0.1:3102/api/inventory/INV-0029", {
    headers: { host: "127.0.0.1:3102", origin: "https://example.com" },
  });
  assert.equal(isPrivateInventoryPreviewRequest(publicRequest, "development"), false);
  assert.equal(isPrivateInventoryPreviewRequest(crossOriginRequest, "development"), false);
});

test("preview inventory overrides are written atomically and load by inventory ID", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "hojavia-preview-inventory-"));
  const filePath = path.join(directory, "inventory-overrides.json");

  await savePreviewInventoryOverride(item, filePath);

  const stored = await loadPreviewInventoryOverrides(filePath);
  const serialized = await readFile(filePath, "utf8");
  assert.deepEqual(stored[item.inventoryId], item);
  assert.doesNotThrow(() => JSON.parse(serialized));
});

test("preview inventory reconciliation persists every created physical lot atomically", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "hojavia-preview-inventory-batch-"));
  const filePath = path.join(directory, "inventory-overrides.json");
  const secondItem: InventoryItem = {
    ...item,
    inventoryId: "INV-FUENTE-PURPLE-DREAM-C07",
    line: "Rare Black",
    vitola: "Torpedo",
    originalQty: 10,
    currentQty: 10,
  };

  await savePreviewInventoryOverrides([item, secondItem], filePath);

  const stored = await loadPreviewInventoryOverrides(filePath);
  assert.deepEqual(Object.keys(stored).sort(), [item.inventoryId, secondItem.inventoryId].sort());
  assert.deepEqual(stored[secondItem.inventoryId], secondItem);
});
