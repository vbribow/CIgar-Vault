import { brand } from "@/lib/brand";
import {
  affiliateProgramShortlist,
  affiliateResearchWatchlist,
  affiliateScoreWeights,
  affiliateShortlistVerifiedAt,
} from "@/lib/affiliate-program-shortlist";
import { affiliateConfigurationAudit } from "@/lib/retailer-affiliate";
import "./affiliate-readiness.css";

export const dynamic = "force-dynamic";

const gates = [
  ["Agreement", "Executed program terms and payment rules"],
  ["Disclosure", "Plain-language compensation statement beside every link"],
  ["Legal", "Tobacco marketing, tax, and program review"],
  ["Privacy", "No private collector data or personal identifiers"],
  ["Adult access", "21+ and geographic/jurisdiction controls"],
  ["Independence", "No effect on evidence, ranking, price, or guidance"],
  ["Founder launch", "Separate dated approval after every other gate"],
] as const;

export default function AffiliateReadinessPage() {
  const audit = affiliateConfigurationAudit();
  const ready = audit.programs.filter(program => program.ready).length;
  const blocked = audit.programs.length - ready;
  return <main className="shell wideShell affiliateReadinessPage">
    <section className="affiliateReadinessHero">
      <div>
        <div className="eyebrow">Founder commercial controls</div>
        <h1>Revenue only when trust remains intact.</h1>
        <p className="lede">Review affiliate readiness without activating a retailer, creating a tracking link, or changing an organic result. Missing or invalid configuration leaves every retailer link direct and untracked.</p>
        <div className="ctaRow"><a className="button secondary" href="/partner-platform">Open Partner Network</a><a className="button secondary" href="/trust">Review commercial independence</a></div>
      </div>
      <aside>
        <strong>{audit.state === "not configured" ? "Safe default" : audit.state === "invalid" ? "Configuration blocked" : ready ? `${ready} technically ready` : "No program ready"}</strong>
        <span>{audit.state === "not configured" ? "No affiliate program is configured or active." : audit.state === "invalid" ? "The server configuration is malformed and has failed closed." : `${blocked} program${blocked === 1 ? "" : "s"} still blocked.`}</span>
      </aside>
    </section>

    <section className="affiliateReadinessMetrics">
      <article><span>Configured</span><strong>{audit.programs.length}</strong><small>server-only program records</small></article>
      <article><span>Ready</span><strong>{ready}</strong><small>all technical gates present</small></article>
      <article><span>Blocked</span><strong>{blocked}</strong><small>cannot produce compensated links</small></article>
      <article><span>Fox status</span><strong>Locked</strong><small>separate explicit approval required</small></article>
    </section>

    <section className="card affiliateGateMap">
      <div className="sectionHead"><div><div className="eyebrow">Universal launch standard</div><h2>Every program passes every gate.</h2><p>Technical readiness is not launch authorization. Attorney review and Brian’s separate launch decision remain mandatory.</p></div></div>
      <div>{gates.map(([title,detail],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><strong>{title}</strong><small>{detail}</small></article>)}</div>
    </section>

    <section className="affiliateProgramList">
      {audit.programs.map(program => <article className={program.ready ? "ready" : "blocked"} key={`${program.programName}-${program.retailerName}`}>
        <header><div><small>{program.status}</small><h2>{program.programName}</h2><p>{program.retailerName} · {program.domains.join(", ")}</p></div><strong>{program.ready ? "Technically ready" : `${program.issues.length} gate${program.issues.length === 1 ? "" : "s"} open`}</strong></header>
        {program.issues.length > 0 && <ul>{program.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
        <p className="affiliateLaunchBoundary">No program shown here may launch without separate founder approval. Affiliate credentials and parameter values are intentionally never displayed.</p>
      </article>)}
      {audit.state === "not configured" && <div className="card affiliateEmptyState"><div className="eyebrow">Current state</div><h2>Direct links only.</h2><p>{brand.name} has the technical foundation, disclosure interface, reporting rules, and rollback protections ready. The next external step is selecting and applying to suitable programs; no application or outreach has been sent.</p></div>}
      {audit.state === "invalid" && <div className="card affiliateEmptyState attention"><div className="eyebrow">Fail-closed protection</div><h2>Invalid configuration cannot monetize a link.</h2><p>Correct the server-only configuration and repeat every readiness review. Organic search and direct retailer links remain unaffected.</p></div>}
    </section>

    <section className="card affiliateResearchSection">
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Private research shortlist · verified {affiliateShortlistVerifiedAt}</div>
          <h2>Strong candidates, still inactive.</h2>
          <p>These rankings measure research readiness—not endorsement, application status, or launch approval. No outreach, application, tracking, or activation has occurred.</p>
        </div>
        <span className="researchOnlyBadge">Research only</span>
      </div>
      <div className="affiliateScoreKey">
        {affiliateScoreWeights.map(([label, points]) => <span key={label}><strong>{points}</strong>{label}</span>)}
      </div>
      <div className="affiliateShortlist">
        {affiliateProgramShortlist.map(candidate => <article key={candidate.retailerName}>
          <header>
            <div><small>{candidate.scoreLabel}</small><h3>{candidate.retailerName}</h3></div>
            <strong>{candidate.score}<span>/100</span></strong>
          </header>
          <div className="candidateFacts">
            <span><small>Network</small>{candidate.network ?? "Not public"}</span>
            <span><small>Commission</small>{candidate.commission}</span>
            <span><small>Referral window</small>{candidate.referralWindow}</span>
          </div>
          <p>{candidate.evidence[0]}</p>
          {candidate.restriction && <p className="candidateRestriction">{candidate.restriction}</p>}
          <a className="sourceLink" href={candidate.programUrl ?? candidate.retailerUrl} target="_blank" rel="noreferrer">Review official source</a>
        </article>)}
      </div>
    </section>

    <section className="card affiliateWatchlist">
      <div className="sectionHead"><div><div className="eyebrow">Research holds</div><h2>Relevant retailers without a verified public program.</h2><p>No score is assigned until an official program and its terms can be verified. Absence from public search is not proof that no private program exists.</p></div></div>
      <div>
        {affiliateResearchWatchlist.map(candidate => <article className={candidate.status === "locked" ? "locked" : ""} key={candidate.retailerName}>
          <header><div><small>{candidate.scoreLabel}</small><h3>{candidate.retailerName}</h3></div><strong>Not scored</strong></header>
          <p>{candidate.evidence[0]}</p>
          <p className="candidateRestriction">{candidate.restriction}</p>
          {candidate.status !== "locked" && <a className="sourceLink" href={candidate.retailerUrl} target="_blank" rel="noreferrer">Review retailer site</a>}
        </article>)}
      </div>
    </section>
  </main>;
}
