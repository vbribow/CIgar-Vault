import { z } from "zod";

const FormBoolean=z.union([z.boolean(),z.literal("true"),z.literal("false")]).transform(value=>value===true||value==="true");

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
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  termsConfirmed: FormBoolean.default(false),
  disclosureApproved: FormBoolean.default(false),
  audienceConsentConfirmed: FormBoolean.default(false),
  privacyReviewed: FormBoolean.default(false),
});

export type PartnerInputValue = z.infer<typeof PartnerInput>;
export type CampaignInputValue = z.infer<typeof CampaignInput>;

export type PartnerRole = "owner" | "administrator" | "editor" | "analyst" | "viewer";
export type PartnerPermission = "partner.manage" | "readiness.submit" | "campaign.create" | "campaign.edit" | "campaign.review" | "campaign.approve" | "campaign.launch" | "campaign.pause" | "analytics.view" | "payouts.view";

const partnerRolePermissions:Record<PartnerRole,readonly PartnerPermission[]>={
  owner:["partner.manage","readiness.submit","campaign.create","campaign.edit","campaign.review","analytics.view","payouts.view"],
  administrator:["readiness.submit","campaign.create","campaign.edit","campaign.review","analytics.view","payouts.view"],
  editor:["readiness.submit","campaign.create","campaign.edit","analytics.view"],
  analyst:["analytics.view","payouts.view"],
  viewer:["analytics.view"],
};

export function partnerCan(role:PartnerRole,permission:PartnerPermission){
  return partnerRolePermissions[role].includes(permission);
}

export type LaunchReadiness = {
  partnerStatus:string;
  campaignsLocked:boolean;
  disclosureText?:string|null;
  commissionRate:number;
  startsAt?:string|null;
  endsAt?:string|null;
  termsConfirmed:boolean;
  disclosureApproved:boolean;
  audienceConsentConfirmed:boolean;
  privacyReviewed:boolean;
};

export function campaignLaunchBlockers(input:LaunchReadiness){
  const blockers:string[]=[];
  if(input.partnerStatus!=="active")blockers.push("Partner must be active");
  if(input.campaignsLocked)blockers.push("Partner campaign creation and testing are founder-locked");
  if(!input.disclosureText?.trim()||input.disclosureText.trim().length<10)blockers.push("Partner disclosure must be complete");
  if(!Number.isFinite(input.commissionRate)||input.commissionRate<=0)blockers.push("Commission terms must be complete");
  if(!input.startsAt||!input.endsAt)blockers.push("Campaign start and end dates are required");
  else if(Date.parse(input.endsAt)<=Date.parse(input.startsAt))blockers.push("Campaign end date must follow its start date");
  if(!input.termsConfirmed)blockers.push("Commercial terms must be confirmed");
  if(!input.disclosureApproved)blockers.push("Promotional disclosure must be approved");
  if(!input.audienceConsentConfirmed)blockers.push("Audience consent must be confirmed");
  if(!input.privacyReviewed)blockers.push("Privacy review must be complete");
  return blockers;
}

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
