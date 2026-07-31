import { PartnerPlatform } from "@/components/partner-platform";
import "./partner-platform.css";

export default async function PartnerPlatformPage({searchParams}:{searchParams:Promise<{pilot?:string}>}){
  const pilotMode=(await searchParams).pilot==="opusx";
  return <main className="shell wideShell partnerPage"><section className="partnerHero"><div><div className="eyebrow">{pilotMode?"Founder research review":"Industry partnerships"}</div><h1>{pilotMode?"Review one source. Keep only what it proves.":"Manage trusted industry relationships."}</h1><p className="lede">{pilotMode?"This guided review turns one official Arturo Fuente page into useful cigar facts. Nothing becomes public during this review.":"Set up organizations, referrals, payments, and access from one protected workspace."}</p></div><div className="partnerPrinciple"><strong>{pilotMode?"Plain facts before conclusions.":"Partnership without surveillance."}</strong><span>{pilotMode?"Source first · Uncertainty visible · Founder decides":"Referral credit and totals only. Partners never see private collector records."}</span></div></section><PartnerPlatform pilotMode={pilotMode}/></main>;
}
