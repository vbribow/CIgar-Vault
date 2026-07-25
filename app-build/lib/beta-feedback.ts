import { z } from "zod";

export const BetaFeedbackInput = z.object({
  category: z.enum(["Bug", "Confusing", "Suggestion", "Trust or data", "Other"]),
  severity: z.enum(["Low", "Medium", "High", "Blocking"]),
  pageUrl: z.string().trim().max(500).optional(),
  summary: z.string().trim().min(5).max(160),
  details: z.string().trim().min(10).max(4000),
});

export type BetaFeedbackInput = z.infer<typeof BetaFeedbackInput>;
