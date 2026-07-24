import { NextRequest, NextResponse } from "next/server";
import { partnerAdmin, referralCookieName } from "@/lib/partner-platform";
import { safePartnerDestination } from "@/lib/partner-model";

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const admin = partnerAdmin();
  if (!admin) return NextResponse.redirect(new URL("/partners/join?notice=Partner%20tracking%20is%20being%20prepared.", request.url));
  const { data: campaign } = await admin
    .from("partner_campaigns")
    .select("id,partner_id,code,destination_path,status,starts_at,ends_at,partners(name,status,campaigns_locked)")
    .eq("code", code.toLowerCase())
    .maybeSingle();
  const partner = campaign?.partners as unknown as { name?: string; status?: string; campaigns_locked?:boolean } | null;
  const now = Date.now();
  const unavailable = !campaign
    || campaign.status !== "active"
    || partner?.status !== "active"
    || partner?.campaigns_locked === true
    || (campaign.starts_at && Date.parse(campaign.starts_at) > now)
    || (campaign.ends_at && Date.parse(campaign.ends_at) < now);
  if (unavailable) return NextResponse.redirect(new URL("/partners/join?error=This%20partner%20invitation%20is%20not%20currently%20active.", request.url));
  const destination = new URL(safePartnerDestination(campaign.destination_path), request.url);
  destination.searchParams.set("ref", campaign.code);
  const { data: click } = await admin.from("partner_clicks").insert({
    partner_id: campaign.partner_id,
    campaign_id: campaign.id,
    landing_path: destination.pathname,
    referrer: request.headers.get("referer"),
    utm_source: request.nextUrl.searchParams.get("utm_source"),
    utm_medium: request.nextUrl.searchParams.get("utm_medium"),
    utm_campaign: request.nextUrl.searchParams.get("utm_campaign"),
  }).select("click_token").single();
  const response = NextResponse.redirect(destination);
  if (click?.click_token) response.cookies.set(referralCookieName, click.click_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 365 * 86_400,
    path: "/",
  });
  return response;
}
