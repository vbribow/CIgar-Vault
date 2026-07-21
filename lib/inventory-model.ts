import { z } from "zod";
import type { InventoryInput, InventoryItem } from "./types";

const optionalText = z.string().trim().max(2000).optional();
const optionalNumber = z.coerce.number().finite().nonnegative().optional();

export const InventoryInputSchema = z.object({
  inventoryId: z.string().trim().min(1).max(100),
  catalogId: optionalText,
  collectionId: optionalText,
  brand: z.string().trim().min(1).max(200),
  line: z.string().trim().max(200).default(""),
  vitola: z.string().trim().min(1).max(200),
  vintage: z.union([z.string().trim().max(20), z.number().int().min(1800).max(2200)]).optional(),
  packaging: optionalText,
  boxCode: optionalText,
  habanosSealPhotoLink: z.string().trim().url().optional().or(z.literal("")),
  originalQty: optionalNumber,
  smokedQty: optionalNumber,
  currentQty: optionalNumber,
  retailValue: optionalNumber,
  actualCost: optionalNumber,
  storageLocationId: optionalText,
  status: optionalText,
  priority: optionalText,
  score: z.coerce.number().min(0).max(100).optional(),
  action: optionalText,
  photoLink: z.string().trim().url().optional().or(z.literal("")),
  provenanceNotes: optionalText,
  notes: optionalText,
}).strict().superRefine((item, context) => {
  if (item.originalQty !== undefined && (item.smokedQty ?? 0) > item.originalQty) {
    context.addIssue({ code: "custom", path: ["smokedQty"], message: "Smoked quantity cannot exceed original quantity" });
  }
});

export function normalizeInventory(item: InventoryInput): InventoryItem {
  const calculated = item.originalQty === undefined ? item.currentQty : item.originalQty - (item.smokedQty ?? 0);
  return { ...item, currentQty: calculated };
}

export function inventoryCompleteness(item: InventoryItem): number {
  const fields = [item.originalQty, item.currentQty, item.retailValue, item.vintage, item.storageLocationId];
  return Math.round((fields.filter((value) => value !== undefined && value !== "").length / fields.length) * 100);
}
