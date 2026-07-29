import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Valuation } from "./types";

type ValuationRecords = Record<string, Valuation>;

const defaultFilePath = path.join(process.cwd(), ".local-data", "valuations.json");
let pendingWrite = Promise.resolve();

export async function loadPreviewValuations(
  filePath = defaultFilePath,
): Promise<Valuation[]> {
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    return Object.values(parsed as ValuationRecords);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function savePreviewValuation(
  valuation: Valuation,
  filePath = defaultFilePath,
) {
  const operation = pendingWrite.then(async () => {
    const records = Object.fromEntries(
      (await loadPreviewValuations(filePath)).map(item => [item.valuationId, item]),
    );
    const existing = records[valuation.valuationId];
    if (existing && JSON.stringify(existing) !== JSON.stringify(valuation)) {
      throw new Error("This valuation submission was already used for different evidence.");
    }
    records[valuation.valuationId] = valuation;
    await mkdir(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
    await rename(temporaryPath, filePath);
    return Boolean(existing);
  });
  pendingWrite = operation.then(() => undefined, () => undefined);
  return operation;
}
