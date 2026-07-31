import { z } from "zod";

export const CigarVisionResultSchema = z.object({
  brand: z.string(), line: z.string(), vitola: z.string(), vintage: z.string().nullable(), packaging: z.string().nullable(),
  fullBoxQty: z.number().int().nonnegative().nullable(), sticksPerBox: z.number().int().positive().nullable(), looseStickQty: z.number().int().nonnegative().nullable(),
  boxCode: z.string().nullable(), confidence: z.enum(["high", "medium", "low"]), evidenceSummary: z.string(), uncertainties: z.array(z.string()),
});

export type CigarVisionResult = z.infer<typeof CigarVisionResultSchema>;

export const cigarVisionJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    brand: { type: "string" }, line: { type: "string" }, vitola: { type: "string" }, vintage: { type: ["string", "null"] },
    packaging: { type: ["string", "null"] }, fullBoxQty: { type: ["integer", "null"], minimum: 0 }, sticksPerBox: { type: ["integer", "null"], minimum: 1 },
    looseStickQty: { type: ["integer", "null"], minimum: 0 }, boxCode: { type: ["string", "null"] }, confidence: { type: "string", enum: ["high", "medium", "low"] },
    evidenceSummary: { type: "string" }, uncertainties: { type: "array", items: { type: "string" } },
  },
  required: ["brand", "line", "vitola", "vintage", "packaging", "fullBoxQty", "sticksPerBox", "looseStickQty", "boxCode", "confidence", "evidenceSummary", "uncertainties"],
} as const;

export function responseOutputText(response: unknown) {
  const value = response as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  return value.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
}
