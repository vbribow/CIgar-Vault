import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import type { PartnerRole } from "@/lib/partner-model";

export const PartnerInvitationInput=z.object({
  partnerId:z.string().uuid(),
  email:z.string().trim().toLowerCase().email(),
  displayName:z.string().trim().min(2).max(120),
  role:z.enum(["owner","administrator","editor","analyst","viewer"]),
  expiresInDays:z.coerce.number().int().min(1).max(30).default(7),
});

export function createInvitationToken(){
  const token=randomBytes(32).toString("base64url");
  return{token,hash:hashInvitationToken(token)};
}
export function hashInvitationToken(token:string){
  return createHash("sha256").update(token).digest("hex");
}

export function invitationExpiresAt(days:number,now=Date.now()){
  return new Date(now+days*86_400_000).toISOString();
}

export function invitationExpired(expiresAt:string,now=Date.now()){
  return Date.parse(expiresAt)<=now;
}

export type WorkspaceMetricRows={
  clicks:{campaign_id:string}[];
  attributions:{campaign_id:string}[];
  conversions:{campaign_id:string;net_revenue_cents:number;status:string}[];
  commissions:{campaign_id:string;amount_cents:number;status:string}[];
};

export function buildWorkspaceMetrics(campaignIds:string[],rows:WorkspaceMetricRows){
  const allowed=new Set(campaignIds);
  const conversions=rows.conversions.filter(row=>allowed.has(row.campaign_id)&&row.status==="confirmed");
  const commissions=rows.commissions.filter(row=>allowed.has(row.campaign_id)&&row.status!=="void");
  return{
    clicks:rows.clicks.filter(row=>allowed.has(row.campaign_id)).length,
    attributedCollectors:rows.attributions.filter(row=>allowed.has(row.campaign_id)).length,
    paidConversions:conversions.length,
    netRevenueCents:conversions.reduce((sum,row)=>sum+Number(row.net_revenue_cents||0),0),
    commissionCents:commissions.reduce((sum,row)=>sum+Number(row.amount_cents||0),0),
  };
}

export type SafeMembership={
  id:string;
  displayName:string;
  email:string;
  role:PartnerRole;
  status:"invited"|"active"|"revoked";
  invitationExpiresAt?:string;
  acceptedAt?:string;
  lastAccessedAt?:string;
};

export function safeMembership(row:Record<string,unknown>):SafeMembership{
  return{
    id:String(row.id),
    displayName:String(row.display_name||"Team member"),
    email:String(row.invited_email||""),
    role:row.role as PartnerRole,
    status:row.status as SafeMembership["status"],
    invitationExpiresAt:row.invitation_expires_at?String(row.invitation_expires_at):undefined,
    acceptedAt:row.accepted_at?String(row.accepted_at):undefined,
    lastAccessedAt:row.last_accessed_at?String(row.last_accessed_at):undefined,
  };
}
