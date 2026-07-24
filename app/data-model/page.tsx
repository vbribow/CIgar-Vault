import type { Metadata } from "next";
import "./data-model.css";

export const metadata: Metadata = {
  title: "How Cedriva Understands a Cigar",
  description: "Explore Cedriva’s collector-centered model for cigar identity, releases, ownership, provenance, evidence, and legacy.",
};

const identityLayers = [
  ["Organization", "Who owns, produces, imports, distributes, or represents it?"],
  ["Brand and line", "Which cigar house and named family does it belong to?"],
  ["Blend and vitola", "What tobacco, construction, size, and shape define the expression?"],
  ["Release and edition", "When, where, and in what production context did it appear?"],
  ["Packaging and artifact", "Which box, band, seal, code, or physical cigar can be observed?"],
  ["Ownership lot", "Which cigars belong to this collector, and what is their private history?"],
] as const;

const trustLevels = [
  ["01", "Official", "Information supplied or confirmed by an authorized manufacturer or organization."],
  ["02", "Verified historical", "History confirmed through multiple trusted or primary sources."],
  ["03", "Expert", "Attributable knowledge from a verified expert working in a relevant field."],
  ["04", "Community", "Collector experience, opinion, observation, review, and shared knowledge."],
  ["05", "AI-assisted", "An inference or recommendation derived from permitted data and clearly labeled as such."],
] as const;

const relationships = [
  { title: "People and craft", body: "Farmers, agronomists, blenders, rollers, founders, factory teams, retailers, historians, and collectors remain connected to the work they contributed.", details: ["Tobacco and place", "Factories and production roles", "Interviews and historical sources"] },
  { title: "The collector’s record", body: "The shared cigar identity stays separate from private ownership, acquisition, storage, journal, valuation, and legacy information.", details: ["Boxes and loose cigars", "Humidors and aging", "Collection timelines and provenance"] },
  { title: "Claims and evidence", body: "Every meaningful claim can carry a source, date, trust level, confidence, commercial disclosure, and correction history.", details: ["Official facts and revisions", "Market observations", "Disagreement without hidden uncertainty"] },
] as const;

export default function DataModelPage() {
  return (
    <main className="shell dataModelPage">
      <section className="dataModelHero">
        <div>
          <div className="eyebrow">The Cedriva Data Model · Working Draft 0.1</div>
          <h1>A cigar is never only a row in an inventory.</h1>
          <p className="lede">It is people, place, agriculture, time, craft, commercial history, and collector experience. Cedriva connects those relationships without losing the clarity a new collector needs.</p>
          <div className="ctaRow"><a className="button" href="#identity">Follow the cigar story</a><a className="button secondary" href="/catalog">Explore the cigar reference</a></div>
        </div>
        <aside>
          <span>The governing model</span>
          <strong>Identity before inventory.</strong>
          <p>Cedriva first determines what a cigar is. Ownership is then documented as a private relationship between the collector and that shared identity.</p>
        </aside>
      </section>

      <section className="dataModelDefinition">
        <div className="eyebrow">What Cedriva means by “a cigar”</div>
        <div className="dataModelDefinitionGrid">
          <article><span>Product</span><h2>The reusable expression</h2><p>A canonical combination of brand, product line, blend, and vitola—the identity shared across discovery, learning, reviews, verification, and market evidence.</p></article>
          <article><span>Release</span><h2>The historical context</h2><p>A product placed into time, geography, factory, edition, packaging, band, MSRP, and distribution history.</p></article>
          <article><span>Ownership lot</span><h2>The collector’s private record</h2><p>One or more physical cigars acquired or managed together, with private quantity, cost, storage, provenance, and activity.</p></article>
        </div>
      </section>

      <section className="dataModelIdentity" id="identity">
        <div className="dataModelSectionIntro">
          <div><div className="eyebrow">The identity ladder</div><h2>Understand the cigar one relationship at a time.</h2></div>
          <p>These layers remain distinct even when the industry uses the same word for several of them. That discipline lets Cedriva preserve expert detail without overwhelming a beginner.</p>
        </div>
        <ol>{identityLayers.map(([title, body], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
      </section>

      <section className="dataModelRelationships">
        <div className="dataModelSectionIntro">
          <div><div className="eyebrow">A living knowledge system</div><h2>Facts become meaningful through connection.</h2></div>
          <p>One shared cigar identity can support collector experiences across Discover, Vault, Review, Market, Verify, Community, Learn, and Cedriva AI.</p>
        </div>
        <div className="dataModelRelationshipGrid">
          {relationships.map((item, index) => <article key={item.title}><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.body}</p><ul>{item.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></article>)}
        </div>
      </section>

      <section className="dataModelTrust">
        <div>
          <div className="eyebrow">Trust travels with the record</div>
          <h2>Collectors should always know what they are reading.</h2>
          <p>Source, confidence, observation date, corrections, disagreement, and commercial influence are part of the information—not labels added after publication.</p>
          <blockquote>Unknown is better than incorrect. Visible uncertainty is stronger than invented precision.</blockquote>
        </div>
        <div className="dataModelTrustList">{trustLevels.map(([number, title, body]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
      </section>

      <section className="dataModelPrivacy">
        <div><div className="eyebrow">Private by default</div><h2>The shared catalog never owns the collector’s life.</h2></div>
        <div>
          <p>Inventory, quantity, acquisition cost, exact storage, personal journals, behavior, photographs, valuations, and legacy instructions remain private unless the collector deliberately shares them.</p>
          <ul>
            <li>Publishing a review does not expose the private journal behind it.</li>
            <li>Sharing a collection view does not reveal cost or exact storage.</li>
            <li>Cedriva AI uses only the context permitted for the interaction.</li>
            <li>Collectors can inspect, correct, remove, and export personal context.</li>
          </ul>
        </div>
      </section>

      <section className="dataModelHistory">
        <div className="eyebrow">History without silent overwrite</div>
        <h2>Current state is a view of what happened—not a replacement for it.</h2>
        <div>
          <article><strong>Products evolve</strong><p>Blend, factory, band, packaging, MSRP, and distribution changes retain effective dates and prior states.</p></article>
          <article><strong>Collections evolve</strong><p>Purchases, smokes, gifts, transfers, storage moves, milestones, and corrections form an enduring timeline.</p></article>
          <article><strong>Knowledge evolves</strong><p>Claims can be challenged, corrected, superseded, or left visibly disputed without erasing the record.</p></article>
        </div>
      </section>

      <section className="dataModelClosing">
        <div><div className="eyebrow">Why this matters</div><h2>Rigorous enough to earn trust. Human enough to preserve meaning.</h2></div>
        <div>
          <p>A beginner can begin with the name and the story. An advanced collector can examine blend revisions, packaging evidence, market observations, provenance, and source history. Both are learning from the same trusted record.</p>
          <div className="ctaRow"><a className="button" href="/inventory">Document my collection</a><a className="button secondary" href="/verification">Preserve provenance</a></div>
        </div>
      </section>
    </main>
  );
}
