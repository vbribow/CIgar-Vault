import type { Metadata } from "next";
import { AgingGuidanceSelector } from "@/components/aging-guidance-selector";
import { publicPageMetadata } from "@/lib/seo";
import { brand } from "@/lib/brand";
import "./resting-and-aging.css";

export const metadata: Metadata = publicPageMetadata(
  "Resting & Aging Cigars",
  "Learn why newly arrived cigars benefit from rest, how long acclimation can take, and how deliberate long-term aging differs from simple storage.",
  "/learn/resting-and-aging",
);

const arrivalWindows = [
  {
    time: "3–7 days",
    title: "A stable local handoff",
    body: "A cigar carried home from a well-managed retailer may need only several quiet days to settle into your humidor. Habanos notes that new arrivals take a few days to acclimatize.",
    signal: "Use this only when storage history and transport conditions are known.",
  },
  {
    time: "2–4 weeks",
    title: "A typical shipped order",
    body: "Mail transit, trucks, aircraft, warehouses, and seasonal temperature changes can leave moisture unevenly distributed. Two weeks is a useful first checkpoint; four weeks is the more conservative standard.",
    signal: "Boveda recommends at least four weeks of separate acclimation for fresh arrivals.",
  },
  {
    time: "4–8+ weeks",
    title: "Unknown, dry, wet, or stressed",
    body: "A cigar that feels brittle, swollen, unusually soft, or clearly over-humidified needs gradual correction—not a deadline. Severe dryness may never be fully reversible.",
    signal: "Wait for stable condition, not merely the calendar.",
  },
] as const;

const ageCheckpoints = [
  ["30–90 days", "Stabilization", "Useful for fresh-rolled cigars, recently shipped boxes, or a blend showing sharpness. This is usually rest and recovery—not meaningful vintage aging."],
  ["6–12 months", "Short maturation", "The tobaccos may feel more integrated and rough edges may soften. Compare against an earlier cigar from the same box rather than relying on memory."],
  ["1–3 years", "Deliberate aging", "A practical window for studying real evolution in aroma, balance, strength, and finish. Some cigars improve; some simply become different."],
  ["5–10 years", "Vintage territory", "Habanos uses five years as the minimum for its Vintage category. Many collectors consider this a serious aging horizon, but no blend is guaranteed to peak here."],
  ["10+ years", "Preservation becomes the craft", "Condition, provenance, original packaging, and periodic tasting matter more than the prestige of the number. Very old does not automatically mean better."],
] as const;

const ageCandidates = [
  ["Promising signs", "Rich aroma, substantial flavor, balanced construction, enough intensity to evolve, and multiple identical cigars that can be sampled over time."],
  ["Reasons to be cautious", "A cigar already delicate, flat, underfilled, poorly fermented, damaged, or simply unenjoyable is not guaranteed to become excellent through patience."],
  ["The honest method", "Age several—not your only cigar. Smoke one now, document it, revisit at planned intervals, and stop waiting when the experience begins to decline."],
] as const;

const myths = [
  ["“Every cigar improves with age.”", "False. Time can soften and integrate, but it can also reduce intensity, aroma, and distinction."],
  ["“Rest and age are the same.”", "No. Rest restores equilibrium after making, shipping, or a storage change. Aging intentionally studies development across months or years."],
  ["“A hard date tells me the peak.”", "No. Blend, fermentation, factory rest, packaging, storage stability, and personal preference all change the answer."],
  ["“More humidity means faster recovery.”", "Dangerous. Rapid rehumidification can swell tobacco unevenly and damage wrappers. Recovery should be gradual."],
  ["“Strength guarantees aging potential.”", "No. Strength, body, flavor concentration, fermentation, and balance are different qualities."],
  ["“If I wait long enough, defects disappear.”", "Construction faults, mold, beetle damage, and fundamentally poor tobacco are not repaired by aging."],
] as const;

export default function RestingAndAgingPage() {
  return (
    <main className="shell restingAgingPage">
      <section className="restHero">
        <div>
          <div className="eyebrow">{brand.name} Learn · Collection Care</div>
          <h1>Let the cigar arrive before you ask it to perform.</h1>
          <p className="lede">
            Resting protects the first experience. Aging creates a longer
            experiment. Knowing the difference prevents impatience, false
            precision, and years spent waiting for a cigar that was already
            ready.
          </p>
          <div className="ctaRow">
            <a className="button" href="#arrival">Choose a resting window</a>
            <a className="button secondary" href="#aging">Understand true aging</a>
          </div>
        </div>
        <aside>
          <span>The rule that matters most</span>
          <strong>Stability before time.</strong>
          <p>A month in unstable conditions is not better than a week in a well-managed environment.</p>
        </aside>
      </section>

      <section className="restDefinition">
        <article>
          <span>Resting</span>
          <h2>Recovery and equilibrium.</h2>
          <p>Resting gives a finished cigar time to equalize after rolling, transportation, temperature swings, or movement between storage environments. The goal is dependable combustion, draw, aroma, and flavor—not simply making the cigar older.</p>
        </article>
        <article>
          <span>Aging</span>
          <h2>Planned development over time.</h2>
          <p>Aging keeps finished cigars in stable conditions for months or years so the tobaccos may integrate and evolve. It is blend-specific, condition-dependent, and never a promise of improvement.</p>
        </article>
      </section>

      <section className="arrivalSection" id="arrival">
        <header className="restSectionHead">
          <div><div className="eyebrow">The arrival protocol</div><h2>How long should a new cigar rest?</h2></div>
          <p>There is no universal number because “new” can mean carried across town, shipped across a continent, fresh from a rolling table, or rescued from unknown storage.</p>
        </header>
        <div className="arrivalWindows">
          {arrivalWindows.map((window) => (
            <article key={window.time}>
              <span>{window.time}</span>
              <h3>{window.title}</h3>
              <p>{window.body}</p>
              <small>{window.signal}</small>
            </article>
          ))}
        </div>
        <div className="arrivalSteps">
          <div><b>01</b><strong>Inspect</strong><p>Look for cracks, mold-like growth, beetle holes, swelling, or an unusual odor before placing an arrival beside the rest of the collection.</p></div>
          <div><b>02</b><strong>Separate</strong><p>Use a quarantine tray, bag, or small humidor so a new arrival can stabilize without changing the environment of established cigars.</p></div>
          <div><b>03</b><strong>Stabilize</strong><p>Choose a consistent environment. Avoid repeatedly moving the cigar or chasing every short-term hygrometer fluctuation.</p></div>
          <div><b>04</b><strong>Test thoughtfully</strong><p>When several identical cigars are available, smoke one at a planned checkpoint and document draw, burn, aroma, sharpness, balance, and finish.</p></div>
        </div>
      </section>

      <section className="experienceStandard">
        <div>
          <div className="eyebrow">Maximize the smoking experience</div>
          <h2>Read the cigar—not only the calendar.</h2>
        </div>
        <div className="experienceSignals">
          <article><span>Ready signals</span><p>Supple wrapper, even firmness, clean aroma, stable storage, normal draw, reliable ignition, and no clear harshness caused by moisture imbalance.</p></article>
          <article><span>Needs more rest</span><p>Repeated relights, tunneling, a tight or swollen feel, acrid heat, muted aroma, or a cigar arriving directly from extreme cold, heat, dryness, or humidity.</p></article>
          <article><span>Not a resting problem</span><p>A consistently plugged bunch, physical damage, mold, beetle activity, or a flavor profile you simply do not enjoy requires a different decision.</p></article>
        </div>
      </section>

      <section className="agingSection" id="aging">
        <header className="restSectionHead">
          <div><div className="eyebrow">True finished-cigar aging</div><h2>Aging begins after the cigar has already been made.</h2></div>
          <p>This is different from curing leaf, fermenting tobacco in pilones, bale aging, barrel aging, or the factory’s own post-roll aging. Those stages happened before the cigar entered your collection.</p>
        </header>
        <div className="ageTimeline">
          {ageCheckpoints.map(([time, title, body]) => (
            <article key={time}><span>{time}</span><div><h3>{title}</h3><p>{body}</p></div></article>
          ))}
        </div>
        <blockquote>
          A cigar’s peak is not the oldest date you can achieve. It is the point
          at which balance, aroma, complexity, and your own preference meet.
        </blockquote>
      </section>

      <section className="candidateSection">
        <div><div className="eyebrow">What deserves cellar time?</div><h2>Age with a hypothesis.</h2><p>“I wonder how this blend will integrate” is a better reason than “old cigars are valuable.”</p></div>
        <div>{ageCandidates.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <AgingGuidanceSelector />

      <section className="agingMyths">
        <div className="eyebrow">Common myths</div>
        <h2>Patience is valuable. Blind faith is not.</h2>
        <div>{myths.map(([claim, answer]) => <article key={claim}><strong>{claim}</strong><p>{answer}</p></article>)}</div>
      </section>

      <section className="agingJournal">
        <div><div className="eyebrow">Build an aging record</div><h2>Turn waiting into knowledge.</h2></div>
        <div>
          <p>Record the box or production date when known, acquisition date, arrival condition, rest start, storage location, climate history, planned checkpoints, and tasting results. Keep “unknown” visible when a date or condition cannot be proven.</p>
          <div className="journalFields">
            <span>Identity</span><span>Box date</span><span>Arrival</span><span>Rest window</span><span>Storage</span><span>Checkpoint</span><span>Tasting</span><span>Decision</span>
          </div>
          <div className="ctaRow"><a className="button" href="/inventory">Choose a cigar to document</a><a className="button secondary" href="/records">Record a tasting</a><a className="button secondary" href="/learn/humidor-climate">Master humidor climate</a><a className="button secondary" href="/humidors">Review storage</a></div>
        </div>
      </section>

      <p className="agingDisclosure">This educational material is intended only for adults of legal age. Timing and climate ranges are starting guidance, not guarantees of flavor, condition, safety, or value.</p>
    </main>
  );
}
