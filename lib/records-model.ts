import { z } from "zod";

const SmokingLogFields = {
  inventoryId: z.string().trim().min(1).max(100),
  cigarName: z.string().trim().min(3).max(300).optional(), dateSmoked: z.iso.date(), vintage: z.union([z.string(), z.number()]).optional(), overall: z.coerce.number().min(0).max(100).optional(),
  flavor: z.string().max(500).optional(), strength: z.string().max(100).optional(), sweetness: z.string().max(100).optional(),
  construction: z.string().max(500).optional(), tastingNotes: z.string().max(4000).optional(), buyAgain: z.boolean().optional(),
};

const requireManualCigar = <T extends z.ZodType<{ inventoryId: string; cigarName?: string }>>(schema: T) =>
  schema.refine(value => value.inventoryId !== "MANUAL" || Boolean(value.cigarName), { message: "Enter the cigar name for a manual smoking record" });

/** Stored records retain every legacy ID. */
export const SmokingLogSchema = requireManualCigar(z.object({
  smokeId: z.string().trim().min(1).max(100),
  ...SmokingLogFields,
}).strict());

/** Collector/API input never owns smokeId. */
export const SmokingLogCreateSchema = requireManualCigar(z.object({
  ...SmokingLogFields,
  submissionId: z.string().uuid().optional(),
  newEntryConfirmed: z.boolean().optional(),
}).strict());

export const ValuationSchema = z.object({
  valuationId: z.string().trim().min(1).max(100), inventoryId: z.string().trim().min(1).max(100), valuationDate: z.iso.date(),
  invalidatedAt: z.iso.datetime().optional(), invalidationReason: z.string().trim().min(1).max(1000).optional(),
  replacementValue: z.coerce.number().nonnegative().optional(), replacementSticksPerBox: z.coerce.number().int().positive().optional(),
  marketValue: z.coerce.number().nonnegative().optional(), source: z.string().max(500).optional(),
  marketEvidenceType: z.enum(["Verified completed sale","Estimated market range","Observed asking price","Insufficient evidence"]).optional(),
  marketRangeLow: z.coerce.number().nonnegative().optional(), marketRangeHigh: z.coerce.number().nonnegative().optional(),
  askingPrice: z.coerce.number().nonnegative().optional(), askingPriceSource: z.string().max(500).optional(), askingPriceSourceUrl: z.string().url().optional().or(z.literal("")),
  comparableCount: z.coerce.number().int().nonnegative().max(100).optional(),
  lastSaleValue: z.coerce.number().nonnegative().optional(), lastSaleDate: z.iso.date().optional(), lastSaleVenue: z.string().max(500).optional(),
  lastSaleSourceUrl: z.string().url().optional().or(z.literal("")),
  sourceUrl: z.string().url().optional().or(z.literal("")), confidence: z.string().max(100).optional(), notes: z.string().max(4000).optional(),
}).strict()
  .refine(value => Boolean(value.invalidatedAt) === Boolean(value.invalidationReason), { message:"Invalidated evidence requires both a timestamp and reason" })
  .refine(value => value.marketRangeLow === undefined || value.marketRangeHigh === undefined || value.marketRangeLow <= value.marketRangeHigh, { message:"Market range low must not exceed market range high" })
  .refine(value => value.marketEvidenceType !== "Verified completed sale" || Boolean(value.lastSaleValue !== undefined && value.lastSaleDate && value.lastSaleSourceUrl), { message:"Verified completed-sale evidence requires value, date, and direct proof" })
  .refine(value => value.marketEvidenceType !== "Estimated market range" || Boolean(value.marketValue !== undefined && value.marketRangeLow !== undefined && value.marketRangeHigh !== undefined && (value.comparableCount ?? 0) >= 2), { message:"An estimated market range requires a value, range, and at least two comparables" })
  .refine(value => value.marketEvidenceType !== "Observed asking price" || Boolean(value.askingPrice !== undefined && value.askingPriceSourceUrl && value.marketValue === undefined), { message:"An observed asking price requires a linked asking price and cannot be saved as market value" })
  .refine(value => value.marketEvidenceType !== "Insufficient evidence" || value.marketValue === undefined, { message:"Insufficient evidence cannot carry a market value" });
