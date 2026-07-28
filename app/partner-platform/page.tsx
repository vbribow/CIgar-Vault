import { PartnerPlatform } from "@/components/partner-platform";
import "./partner-platform.css";

export default function PartnerPlatformPage(){
  return <main className="shell wideShell partnerPage"><section className="partnerHero"><div><div className="eyebrow">Industry layer</div><h1>One platform for every trusted partner.</h1><p className="lede">Configure the organization, campaign, attribution window, commission rule, and payment status once. Every partner—from a retailer to a lounge or creator—uses the same transparent foundation.</p></div><div className="partnerPrinciple"><strong>Partnership without surveillance.</strong><span>First-party attribution. Aggregated reporting. No access to private collector records.</span></div></section><PartnerPlatform/></main>;
}
