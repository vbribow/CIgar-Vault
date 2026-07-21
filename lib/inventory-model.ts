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
  habanosVerified: z.boolean().optional(),
  originalQty: optionalNumber,
  smokedQty: optionalNumber,
  currentQty: optionalNumber,
  fullBoxQty: z.coerce.number().int().nonnegative().optional(),
  sticksPerBox: z.coerce.number().int().positive().optional(),
  looseStickQty: z.coerce.number().int().nonnegative().optional(),
  knownBoxSizes: z.string().trim().max(100).optional(),
  boxFormatSourceUrl: z.string().trim().url().optional().or(z.literal("")),
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
  if ((item.fullBoxQty ?? 0) > 0 && item.sticksPerBox === undefined) {
    context.addIssue({ code: "custom", path: ["sticksPerBox"], message: "Cigars per box is required when full boxes are entered" });
  }
  const breakdownTotal = (item.fullBoxQty ?? 0) * (item.sticksPerBox ?? 0) + (item.looseStickQty ?? 0);
  if ((item.fullBoxQty !== undefined || item.looseStickQty !== undefined) && (item.smokedQty ?? 0) > breakdownTotal) {
    context.addIssue({ code: "custom", path: ["smokedQty"], message: "Smoked quantity cannot exceed the box-and-stick total" });
  }
  if (item.habanosVerified && (!item.boxCode || !item.habanosSealPhotoLink)) {
    context.addIssue({ code: "custom", path: ["habanosVerified"], message: "Add both a box code and Habanos seal photo before marking this lot verified" });
  }
});

export function normalizeInventory(item: InventoryInput): InventoryItem {
  const hasOwnershipBreakdown = item.fullBoxQty !== undefined || item.looseStickQty !== undefined;
  const originalQty = hasOwnershipBreakdown
    ? (item.fullBoxQty ?? 0) * (item.sticksPerBox ?? 0) + (item.looseStickQty ?? 0)
    : item.originalQty;
  const currentQty = originalQty === undefined ? item.currentQty : Math.max(0, originalQty - (item.smokedQty ?? 0));
  return { ...item, originalQty, currentQty };
}

export function inventoryCompleteness(item: InventoryItem): number {
  const fields = [item.originalQty, item.currentQty, item.retailValue, item.vintage, item.storageLocationId];
  return Math.round((fields.filter((value) => value !== undefined && value !== "").length / fields.length) * 100);
}
