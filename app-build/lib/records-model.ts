import { z } from "zod";

export const SmokingLogSchema = z.object({
  smokeId: z.string().trim().min(1).max(100), inventoryId: z.string().trim().min(1).max(100),
  cigarName: z.string().trim().min(3).max(300).optional(), dateSmoked: z.iso.date(), vintage: z.union([z.string(), z.number()]).optional(), overall: z.coerce.number().min(0).max(100).optional(),
  flavor: z.string().max(500).optional(), strength: z.string().max(100).optional(), sweetness: z.string().max(100).optional(),
  construction: z.string().max(500).optional(), tastingNotes: z.string().max(4000).optional(), buyAgain: z.boolean().optional(),
}).strict().refine(value => value.inventoryId !== "MANUAL" || Boolean(value.cigarName), { message: "Enter the cigar name for a manual smoking record" });

export const ValuationSchema = z.object({
  valuationId: z.string().trim().min(1).max(100), inventoryId: z.string().trim().min(1).max(100), valuationDate: z.iso.date(),
  replacementValue: z.coerce.number().nonnegative().optional(), marketValue: z.coerce.number().nonnegative().optional(), source: z.string().max(500).optional(),
  lastSaleValue: z.coerce.number().nonnegative().optional(), lastSaleDate: z.iso.date().optional(), lastSaleVenue: z.string().max(500).optional(),
  lastSaleSourceUrl: z.string().url().optional().or(z.literal("")),
  sourceUrl: z.string().url().optional().or(z.literal("")), confidence: z.string().max(100).optional(), notes: z.string().max(4000).optional(),
}).strict();
