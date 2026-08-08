import { z } from "zod";
import type { InventoryInput, InventoryItem } from "./types";
import { physicalLotDesignation } from "./physical-lot-identity";

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
  acquisitionSeller: optionalText,
  acquisitionDate: optionalText,
  acquisitionSourceUrl: z.string().trim().url().optional().or(z.literal("")),
  acquisitionReceiptLink: z.string().trim().url().optional().or(z.literal("")),
  purchaseJurisdiction: optionalText,
  habanosVerificationDate: optionalText,
  habanosVerificationResult: optionalText,
  habanosVerificationEvidenceLink: z.string().trim().url().optional().or(z.literal("")),
  habanosVerificationNotes: optionalText,
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
  boxPhotoLink: z.string().trim().url().optional().or(z.literal("")),
  boxCodePhotoLink: z.string().trim().url().optional().or(z.literal("")),
  provenanceDocumentLink: z.string().trim().url().optional().or(z.literal("")),
  provenanceNotes: optionalText,
  notes: optionalText,
}).strict().superRefine((item, context) => {
  const lotDesignation = physicalLotDesignation(item.vitola);
  if (lotDesignation) {
    context.addIssue({
      code: "custom",
      path: ["vitola"],
      message: `${lotDesignation.label} is a physical-lot note. Use exact vitola “${lotDesignation.canonicalVitola}” and preserve the box or lot number in provenance notes.`,
    });
  }
  if (item.originalQty !== undefined && (item.smokedQty ?? 0) > item.originalQty) {
    context.addIssue({ code: "custom", path: ["smokedQty"], message: "Smoked quantity cannot exceed original quantity" });
  }
  if ((item.fullBoxQty ?? 0) > 0 && item.sticksPerBox === undefined) {
    context.addIssue({ code: "custom", path: ["sticksPerBox"], message: "Cigars per box is required when full boxes are entered" });
  }
  if (item.habanosVerified && (!item.boxCode || !item.habanosSealPhotoLink)) {
    context.addIssue({ code: "custom", path: ["habanosVerified"], message: "Add both a box code and Habanos seal photo before recording a matching official lookup" });
  }
});

export function parseInventoryUpdate(value: unknown, existing?: InventoryItem): InventoryInput {
  const first = InventoryInputSchema.safeParse(value);
  if (first.success) return first.data;
  const legacyVerified = existing?.habanosVerified === true && typeof value === "object" && value !== null && (value as Record<string, unknown>).habanosVerified === true;
  const verificationOnly = first.error.issues.every(issue => issue.path[0] === "habanosVerified");
  if (!legacyVerified || !verificationOnly) throw first.error;
  const parsed = InventoryInputSchema.parse({ ...(value as Record<string, unknown>), habanosVerified: false });
  return { ...parsed, habanosVerified: true };
}

export function normalizeInventory(item: InventoryInput): InventoryItem {
  const hasOwnershipBreakdown = item.fullBoxQty !== undefined || item.looseStickQty !== undefined;
  const countedQty = hasOwnershipBreakdown ? (item.fullBoxQty ?? 0) * (item.sticksPerBox ?? 0) + (item.looseStickQty ?? 0) : undefined;
  const currentQty = countedQty ?? (item.originalQty === undefined ? item.currentQty : Math.max(0, item.originalQty - (item.smokedQty ?? 0)));
  const originalQty = countedQty === undefined ? item.originalQty : countedQty + (item.smokedQty ?? 0);
  return { ...item, originalQty, currentQty };
}

function consumeNextInventory(item: InventoryItem): InventoryItem {
  const smokedQty = (item.smokedQty ?? 0) + 1;
  if (item.looseStickQty !== undefined || item.fullBoxQty !== undefined) {
    if ((item.looseStickQty ?? 0) > 0) return normalizeInventory({ ...item, smokedQty, looseStickQty: (item.looseStickQty ?? 0) - 1 });
    if ((item.fullBoxQty ?? 0) > 0 && item.sticksPerBox) return normalizeInventory({ ...item, smokedQty, fullBoxQty: (item.fullBoxQty ?? 0) - 1, looseStickQty: item.sticksPerBox - 1 });
  }
  return normalizeInventory({ ...item, smokedQty });
}

export function consumeInventory(item: InventoryItem, quantity: number): InventoryItem {
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Cigars smoked must be a whole number of at least 1");
  if (item.currentQty === undefined) throw new Error(`Record the remaining quantity for ${item.inventoryId} before logging a smoke`);
  if (quantity > item.currentQty) throw new Error(`${item.inventoryId} has only ${item.currentQty} cigar${item.currentQty === 1 ? "" : "s"} remaining`);
  let updated = item;
  for (let index = 0; index < quantity; index += 1) updated = consumeNextInventory(updated);
  return updated;
}

export function consumeOneInventory(item: InventoryItem): InventoryItem {
  return consumeInventory(item, 1);
}

/**
 * Historical edits sometimes increase `smokedQty` directly instead of using
 * Log a Smoke. When the collector has not also edited the physical count,
 * apply that increase through the same box-opening logic as a smoking log.
 * Explicit quantity edits remain authoritative and are never inferred over.
 */
export function reconcileSmokedQuantityEdit(input: InventoryInput, existing: InventoryItem): InventoryInput {
  const increase=(input.smokedQty??0)-(existing.smokedQty??0);
  const physicalCountUnchanged=input.fullBoxQty===existing.fullBoxQty
    && input.sticksPerBox===existing.sticksPerBox
    && input.looseStickQty===existing.looseStickQty;
  if(increase<=0||!physicalCountUnchanged)return input;
  let corrected=normalizeInventory({...existing,...input,smokedQty:existing.smokedQty??0});
  for(let index=0;index<increase;index+=1)corrected=consumeOneInventory(corrected);
  return{
    ...input,
    originalQty:corrected.originalQty,
    currentQty:corrected.currentQty,
    smokedQty:corrected.smokedQty,
    fullBoxQty:corrected.fullBoxQty,
    sticksPerBox:corrected.sticksPerBox,
    looseStickQty:corrected.looseStickQty,
  };
}

export function applyTotalQuantityCorrection(item: InventoryInput,total:number):InventoryInput{
  if(!Number.isInteger(total)||total<0)throw new Error("Corrected total quantity must be a whole number at or above zero");
  const{fullBoxQty:_,sticksPerBox:__,looseStickQty:___,...rest}=item;
  return{...rest,originalQty:total+(item.smokedQty??0),currentQty:total};
}

export function manualInventoryId(now=Date.now(),random=Math.random()){
  const time=now.toString(36).toUpperCase();
  const suffix=Math.floor(random*0xFFFFFF).toString(36).toUpperCase().padStart(5,"0").slice(-5);
  return `INV-${time}-${suffix}`;
}

export function inventoryCompleteness(item: InventoryItem): number {
  const checks = [
    hasPhysicalQuantityBreakdown(item),
    item.retailValue !== undefined,
    item.vintage !== undefined && String(item.vintage).trim() !== "",
    Boolean(item.storageLocationId?.trim()),
    hasInventoryProvenance(item),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function hasPhysicalQuantityBreakdown(item: InventoryItem): boolean {
  return item.fullBoxQty !== undefined && item.looseStickQty !== undefined;
}

export function hasInventoryProvenance(item: InventoryItem): boolean {
  return Boolean(item.provenanceNotes?.trim() || item.provenanceDocumentLink?.trim());
}

export function hasDocumentedCurrentQuantity(item: InventoryItem): boolean {
  return typeof item.currentQty === "number" && Number.isFinite(item.currentQty) && item.currentQty >= 0;
}

export function isCurrentInventoryRecord(item: InventoryItem): boolean {
  return item.currentQty !== 0;
}

export function isActiveInventoryHolding(item: InventoryItem): boolean {
  return typeof item.currentQty === "number" && item.currentQty > 0;
}
