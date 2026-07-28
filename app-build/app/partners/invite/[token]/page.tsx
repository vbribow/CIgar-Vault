import { PartnerInvitation } from "@/components/partner-invitation";
import { HojaviaMark } from "@/components/hojavia-mark";
import { brand } from "@/lib/brand";
import "./invitation.css";

export const dynamic="force-dynamic";
export default async function InvitationPage({params}:{params:Promise<{token:string}>}){
  const{token}=await params;
  return <main className="invitationShell"><section><a className="appBrand" href="/">{!brand.isPreview&&<HojaviaMark/>}<span><strong>{brand.name}</strong><small>Industry collaboration</small></span></a><div><div className="eyebrow">Trusted participation</div><h1>Work together without compromising collector trust.</h1><p className="lede">Every workspace is organization-scoped, role-controlled, and permanently audited.</p></div><small>Founder-controlled launch · Private collector records · Revocable access</small></section><aside><PartnerInvitation token={token}/></aside></main>;
}
