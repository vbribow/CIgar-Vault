import { partnerAdmin } from "@/lib/partner-platform";
import { CedrivaMark } from "@/components/cedriva-mark";
import { brand } from "@/lib/brand";
import "./partner-join.css";

export const dynamic = "force-dynamic";

export default async function PartnerJoinPage({ searchParams }: {
  searchParams: Promise<{ ref?: string; error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const admin = partnerAdmin();
  const { data: campaign } = admin && params.ref
    ? await admin.from("partner_campaigns").select("name,code,partners(name,disclosure_text)").eq("code", params.ref).maybeSingle()
    : { data: null };
  const partner = campaign?.partners as unknown as { name?: string; disclosure_text?: string } | null;
  const partnerName = partner?.name;
  return <main className="partnerJoin">
    <section className="partnerJoinStory">
      <a className="appBrand" href="/">{!brand.isPreview&&<CedrivaMark/>}<span><strong>{brand.name}</strong><small>{brand.brandLine}</small></span></a>
      <div>
        <div className="eyebrow">{partnerName ? `A personal invitation from ${partnerName}` : `Welcome to ${brand.name}`}</div>
        <h1>Document the collection. Understand the culture. Preserve the story.</h1>
        <p className="lede">{brand.name} grows with you—from the first premium cigar to a collection built for generations.</p>
      </div>
      <div className="partnerValues"><span>Private by default</span><span>Education with depth</span><span>Trust-labeled intelligence</span></div>
    </section>
    <section className="partnerJoinAction">
      {params.error&&<div className="loginMessage error">{params.error}</div>}
      {params.notice&&<div className="loginMessage">{params.notice}</div>}
      <div className="eyebrow">Your trusted collector home</div>
      <h2>Begin your collector journey</h2>
      <p>Learn, document, manage, and understand every cigar with tools designed around the collector—not merely the inventory.</p>
      <div className="partnerBenefits">
        <article><strong>Learn with confidence</strong><span>From seed and fermentation through blending, rolling, storage, and aging.</span></article>
        <article><strong>Preserve your collection</strong><span>Document boxes, singles, provenance, condition, value, and the stories behind them.</span></article>
        <article><strong>Receive personal guidance</strong><span>Recommendations become more useful as the platform learns your palate and goals.</span></article>
      </div>
      <a className="button" href="/login?mode=signup">Create your collector home</a>
      <small className="partnerDisclosure">{partner?.disclosure_text || "The platform may compensate participating partners for eligible paid memberships. Partner relationships never determine which cigar information is included or how it is presented."}</small>
    </section>
  </main>;
}
