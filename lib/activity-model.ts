import { z } from "zod";

export const activityTypes = ["Purchase", "Add sticks", "Add box", "Open box", "Smoke", "Gift", "Sale", "Damaged / discarded", "Correction", "Storage move"] as const;

export const ActivityInputSchema = z.object({
  inventoryId: z.string().trim().min(1).max(100),
  eventDate: z.iso.date(),
  eventType: z.enum(activityTypes),
  quantity: z.coerce.number().int().nonnegative().default(0),
  boxes: z.coerce.number().int().nonnegative().default(0),
  totalAmount: z.coerce.number().finite().nonnegative().optional(),
  toStorage: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
}).strict().superRefine((value, context) => {
  if (["Purchase", "Add sticks", "Gift", "Sale", "Damaged / discarded", "Correction"].includes(value.eventType) && value.quantity === 0 && value.boxes === 0) context.addIssue({ code: "custom", path: ["quantity"], message: "Enter a stick or box quantity" });
  if (value.eventType === "Add box" && value.boxes === 0) context.addIssue({ code: "custom", path: ["boxes"], message: "Enter the number of boxes" });
  if (value.eventType === "Storage move" && !value.toStorage) context.addIssue({ code: "custom", path: ["toStorage"], message: "Choose the destination storage location" });
});

export type ActivityInput = z.infer<typeof ActivityInputSchema>;
