import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { isPrivatePreviewHostname } from "./preview-host";
import type { InventoryItem } from "./types";

type InventoryOverrides = Record<string, InventoryItem>;

const defaultFilePath = path.join(process.cwd(), ".local-data", "inventory-overrides.json");
let pendingWrite = Promise.resolve();

export function isPrivateInventoryPreviewRequest(
  request: Request,
  nodeEnv = process.env.NODE_ENV,
) {
  if (nodeEnv === "production") return false;

  const requestUrl = new URL(request.url);
  const hostUrl = new URL(
    `${requestUrl.protocol}//${request.headers.get("host") ?? requestUrl.host}`,
  );
  if (!isPrivatePreviewHostname(hostUrl.hostname)) return false;

  const origin = request.headers.get("origin");
  if (origin && new URL(origin).origin !== hostUrl.origin) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "none";
}

export async function loadPreviewInventoryOverrides(
  filePath = defaultFilePath,
): Promise<InventoryOverrides> {
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as InventoryOverrides
      : {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

export async function savePreviewInventoryOverride(
  item: InventoryItem,
  filePath = defaultFilePath,
) {
  return savePreviewInventoryOverrides([item],filePath);
}

export async function savePreviewInventoryOverrides(
  items: InventoryItem[],
  filePath = defaultFilePath,
) {
  const operation = pendingWrite.then(async () => {
    const overrides = await loadPreviewInventoryOverrides(filePath);
    for(const item of items) overrides[item.inventoryId] = item;
    await mkdir(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(overrides, null, 2)}\n`, "utf8");
    await rename(temporaryPath, filePath);
  });
  pendingWrite = operation.catch(() => undefined);
  return operation;
}
