import { z } from "zod";
import type { InventoryItem, WishlistItem } from "./types";

export const BuyAgainIntentSchema = z.object({
  inventoryId: z.string().trim().min(1).max(120),
  submissionId: z.string().uuid(),
}).strict();

const normalized = (value?: string) => value?.trim().replace(/\s+/g, " ").toLowerCase() || "";

export function sameBuyAgainTarget(item: Pick<InventoryItem, "brand" | "line" | "vitola">, target: Pick<WishlistItem, "brand" | "line" | "vitola">) {
  return normalized(item.brand) === normalized(target.brand) && normalized(item.line) === normalized(target.line) && normalized(item.vitola) === normalized(target.vitola);
}

export function safeRecordedPurchaseUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : undefined;
  } catch { return undefined; }
}
