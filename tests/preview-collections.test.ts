import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadPreviewCollections, savePreviewCollection } from "../lib/preview-collections";
import type { CigarCollection } from "../lib/types";

const collection: CigarCollection = {
  collectionId: "COL-FUENTE-PURPLE-DREAM",
  name: "Big Purple Dream Humidor",
  maker: "Arturo Fuente × Prometheus",
  releaseYear: 2026,
  expectedComponents: 11,
  expectedCigars: 106,
  presentationInventoryId: "INV-0003",
  status: "Opened",
};

test("private preview collections persist by canonical collection ID", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "hojavia-preview-collections-"));
  const filePath = path.join(directory, "collections.json");
  await savePreviewCollection(collection, filePath);
  assert.deepEqual(await loadPreviewCollections(filePath), [collection]);
});

test("new collection drafts do not preselect every inventory lot", async () => {
  const source = await readFile(
    path.resolve(process.cwd(), "components/collections-manager.tsx"),
    "utf8",
  );
  assert.match(
    source,
    /defaultChecked=\{Boolean\(current\?\.collectionId\)&&item\.collectionId===current\?\.collectionId\}/,
  );
});

test("the private preview Vault loads locally saved collections", async () => {
  const source = await readFile(
    path.resolve(process.cwd(), "app/inventory/page.tsx"),
    "utf8",
  );
  assert.doesNotMatch(source, /mode === "mock" \? Promise\.resolve\(\[\]\) : loadCollections\(\)/);
  assert.match(source, /loadCollections\(\)/);
});
