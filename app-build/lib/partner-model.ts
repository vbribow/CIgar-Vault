import { z } from "zod";

export const PartnerInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  partnerType: z.enum(["retailer", "lounge", "manufacturer", "creator", "media", "industry", "other"]),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  contactName: z.string().trim().max(120).optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  disclosureText: z.string().trim().min(10).max(500),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const CampaignInput = z.object({
  partnerId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  channel: z.enum(["email", "website", "social", "event", "qr", "creator", "other"]),
  destinationPath: z.string().trim().startsWith("/").max(300).default("/partners/join"),
  attributionWindowDays: z.coerce.number().int().min(1).max(365).default(30),
  commissionType: z.enum(["percentage", "fixed"]).default("percentage"),
  commissionRate: z.coerce.number().min(0).max(100000).default(20),
  holdDays: z.coerce.number().int().min(0).max(180).default(30),
});

export type PartnerInputValue = z.infer<typeof PartnerInput>;
export type CampaignInputValue = z.infer<typeof CampaignInput>;

export function commissionAmountCents(
  netRevenueCents: number,
  commissionType: "percentage" | "fixed",
  commissionRate: number,
) {
  if (!Number.isFinite(netRevenueCents) || netRevenueCents <= 0) return 0;
  if (commissionType === "fixed") return Math.max(0, Math.round(commissionRate));
  return Math.max(0, Math.round(netRevenueCents * (commissionRate / 100)));
}

export function referralPath(code: string, origin = "") {
  return `${origin}/r/${encodeURIComponent(code)}`;
}

export function safePartnerDestination(path: string | null | undefined) {
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/partners/join";
}
