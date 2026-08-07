import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CigarCollection } from "./types";

type CollectionRecords = Record<string, CigarCollection>;

const defaultFilePath = path.join(process.cwd(), ".local-data", "collections.json");
let pendingWrite = Promise.resolve();

export async function loadPreviewCollections(
  filePath = defaultFilePath,
): Promise<CigarCollection[]> {
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    return Object.values(parsed as CollectionRecords);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function savePreviewCollection(
  collection: CigarCollection,
  filePath = defaultFilePath,
) {
  const operation = pendingWrite.then(async () => {
    const records = Object.fromEntries(
      (await loadPreviewCollections(filePath)).map(item => [item.collectionId, item]),
    );
    records[collection.collectionId] = collection;
    await mkdir(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
    await rename(temporaryPath, filePath);
  });
  pendingWrite = operation.catch(() => undefined);
  return operation;
}
