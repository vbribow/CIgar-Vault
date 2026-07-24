import type { Metadata } from "next";
import "./seed-to-smoke.css";

export const metadata: Metadata = {
  title: "Seed to Smoke",
  description: "Follow premium cigar tobacco from seed, soil, and harvest through curing, fermentation, blending, rolling, quality control, aging, and the collector.",
};

const journey = [
  {
    number: "01",
    title: "Seed and intention",
    people: "Seed specialists · Agronomists · Growers",
    body: "Long before a cigar has a name, someone chooses tobacco genetics for a particular climate, soil, position in the eventual blend, and desired character. Seed is raised carefully before the strongest young plants are selected for the field.",
    difficulty: "A decision made at the beginning can shape yield, disease resistance, leaf size, texture, combustion, strength, and flavor months or years later.",
  },
  {
    number: "02",
    title: "Soil and cultivation",
    people: "Farm families · Field crews · Agronomists",
    body: "Tobacco is transplanted, tended, protected, topped, and managed according to its purpose. Sun-grown and shade-grown crops demand different care. Weather, water, wind, pests, disease, and soil conditions can alter an entire harvest.",
    difficulty: "Premium tobacco is agricultural—not manufactured to perfect uniformity. The grower works with a living crop and accepts risk every season.",
  },
  {
    number: "03",
    title: "Priming and harvest",
    people: "Primers · Field supervisors · Sorters",
    body: "Leaves mature at different times and are harvested in successive primings from the lower plant upward. Their position influences thickness, strength, oil, combustion, and the role they may eventually play.",
    difficulty: "The team must recognize maturity leaf by leaf. Harvesting too early or too late can sacrifice qualities that cannot be restored later.",
  },
  {
    number: "04",
    title: "Curing",
    people: "Curing-barn teams · Growers · Fermentation specialists",
    body: "Freshly harvested leaves are arranged in curing barns where air, heat, humidity, spacing, and time are managed as the leaf loses moisture and changes color. Curing prepares tobacco for fermentation; it does not finish the tobacco.",
    difficulty: "The process must progress evenly without trapping moisture, drying too quickly, or allowing fragile leaf to deteriorate.",
  },
  {
    number: "05",
    title: "Fermentation and aging",
    people: "Pilón teams · Fermentation masters · Warehouse stewards",
    body: "Conditioned leaves are assembled into controlled piles, or pilones. Natural heat develops inside. Teams monitor and turn the tobacco so temperature and moisture remain appropriate. Leaves may then rest and age before blending.",
    difficulty: "Fermentation can refine aroma and smoking character, but poor control can permanently damage valuable tobacco. Experience is measured in judgment, not a timer alone.",
  },
  {
    number: "06",
    title: "Sorting and classification",
    people: "Classifiers · Despalilladores · Leaf buyers",
    body: "Leaves are evaluated by origin, plant position, texture, color, condition, size, strength, and potential use. Wrapper, binder, and filler are jobs within a cigar—not simple rankings of good, better, and best.",
    difficulty: "Two leaves from the same field can serve different purposes. Accurate classification protects both the tobacco and the blender’s intent.",
  },
  {
    number: "07",
    title: "Blend and preparation",
    people: "Master blenders · Factory teams · Leaf-preparation specialists",
    body: "Blenders combine tobaccos for aroma, flavor, strength, combustion, structure, and evolution from first light to finish. Before rolling, leaves are conditioned and prepared so they can be handled without losing their essential character.",
    difficulty: "A blend must work as a complete cigar and remain recognizable across crops whose natural character is never perfectly identical.",
  },
  {
    number: "08",
    title: "Construction and control",
    people: "Boncheros · Torcedores · Supervisors · Draw and quality-control teams",
    body: "Filler is formed, binder establishes the bunch, molds set the shape, wrapper is applied under controlled tension, and the cap completes the head. Dimensions, weight, draw, firmness, appearance, and internal construction are checked.",
    difficulty: "The roller must create deliberate airflow and consistent density while working with leaves that vary naturally in thickness, elasticity, and shape.",
  },
  {
    number: "09",
    title: "Rest, release, and stewardship",
    people: "Aging-room teams · Packagers · Importers · Distributors · Retailers · Lounge teams · Collectors",
    body: "Finished cigars rest, are sorted for presentation, banded, boxed, transported, stored, introduced by retailers, and finally cared for by collectors. Proper handling must continue across every handoff.",
    difficulty: "The work of the field and factory can still be compromised by poor storage, careless transportation, misinformation, or a lost historical record.",
  },
] as const;

const rollerPath = [
  ["Leaf literacy", "Recognize moisture, elasticity, grain, veins, damage, and usable orientation before cutting."],
  ["Preparation", "Handle, smooth, select, and cut tobacco with control while conserving valuable leaf."],
  ["Foundational bunching", "Build even density and a continuous smoke channel without twisting or creating voids."],
  ["Mold and press control", "Use molds, pressure, rotation, and timing to establish shape without damaging the bunch."],
  ["Wrapper application", "Manage tension, seam placement, stretch, and direction for a clean and stable finish."],
  ["Cap and finish", "Form a secure head, cut precise dimensions, and execute the factory’s required cap and foot."],
  ["Production consistency", "Repeat weight, length, ring gauge, feel, appearance, and draw across an entire assignment."],
  ["Complex vitolas", "Master narrow formats, large rings, tapered heads, perfectos, salomones, and other figurados."],
  ["Master stewardship", "Sustain elite construction, handle rare or delicate leaf, teach others, diagnose defects, and protect factory standards."],
] as const;

const qualifications = [
  ["Construction", "Density, alignment, binder control, wrapper tension, seams, cap, foot, and dimensional accuracy."],
  ["Performance", "Draw resistance, combustion, burn behavior, structural stability, and consistency from cigar to cigar."],
  ["Material judgment", "Using each leaf appropriately, minimizing damage and waste, and adapting technique to natural variation."],
  ["Reliability", "Maintaining quality through a working day—not producing one beautiful demonstration cigar."],
  ["Range", "Progressing from straightforward parejos to increasingly difficult sizes, shapes, tobaccos, and finishing methods."],
  ["Accountability", "Traceable work, response to inspection, low rejection, correction of recurring defects, and respect for the blend."],
  ["Leadership", "Teaching technique, protecting standards, identifying problems, and earning the factory’s trust."],
] as const;

const qualityChecks = [
  "Correct length, ring gauge, weight, and shape",
  "Even firmness without hard plugs or soft voids",
  "Appropriate draw before wrapper is applied",
  "Clean wrapper tension, seams, head, cap, and foot",
  "Internal bunch construction and blend placement",
  "Burn, aroma, flavor, strength, and house character",
  "Traceability to roller, vitola, and production date",
] as const;

export default function SeedToSmokePage() {
  return (
    <main className="shell seedToSmokePage">
      <section className="seedHero">
        <div>
          <div className="eyebrow">Cedriva Learn · Seed to Smoke</div>
          <h1>Before it becomes a cigar, tobacco must survive a thousand decisions.</h1>
          <p className="lede">Premium cigars begin in agriculture and arrive through years of judgment, risk, patience, and skilled hands. Understanding that journey changes the way a collector experiences every cigar.</p>
          <div className="ctaRow"><a className="button" href="#journey">Follow the complete journey</a><a className="button secondary" href="#torcedor">Meet the torcedor’s craft</a></div>
        </div>
        <aside>
          <span>The Cedriva learning standard</span>
          <blockquote>Explain how it came to exist, who made it possible, why it is difficult, and how that knowledge deepens the collector’s experience.</blockquote>
        </aside>
      </section>

      <section className="seedThesis">
        <div className="eyebrow">Respect begins with understanding</div>
        <h2>A premium cigar is agriculture, craft, logistics, and living history.</h2>
        <p>No single person “makes” a cigar alone. Seed specialists, farm families, agronomists, primers, curing and fermentation teams, classifiers, blenders, rollers, quality-control teams, packagers, distributors, retailers, lounge teams, and collectors each protect part of its story.</p>
      </section>

      <section className="seedJourney" id="journey">
        <div className="seedSectionHead">
          <div><div className="eyebrow">The complete journey</div><h2>From possibility in the seed to meaning in the collection.</h2></div>
          <p>Each stage creates qualities the next stage must preserve. No later process can simply manufacture excellence back into tobacco after it has been lost.</p>
        </div>
        <div className="seedJourneyList">
          {journey.map((stage) => <article key={stage.number}>
            <div className="seedJourneyNumber">{stage.number}</div>
            <div className="seedJourneyCopy"><span>{stage.people}</span><h3>{stage.title}</h3><p>{stage.body}</p></div>
            <div className="seedDifficulty"><strong>Why it is difficult</strong><p>{stage.difficulty}</p></div>
          </article>)}
        </div>
      </section>

      <section className="torcedorIntro" id="torcedor">
        <div>
          <div className="eyebrow">The path of the torcedor</div>
          <h2>Mastery is earned through repeatable judgment.</h2>
        </div>
        <div>
          <p>Rolling is not measured only by speed or appearance. Advancement requires control of tobacco, construction, airflow, dimensions, finishing, consistency, and increasingly difficult vitolas under real production conditions.</p>
          <p className="torcedorNote"><strong>A necessary distinction:</strong> qualification systems differ by country, era, and factory. Official Habanos educational material currently describes four grades of torcedor. “Category 9” is also used within the Cuban legacy tradition, especially by Miami factories. Cedriva presents the nine stages below as a learning framework—not as a universal credential.</p>
        </div>
      </section>

      <section className="rollerPath" aria-label="Nine stages of torcedor development">
        {rollerPath.map(([title, body], index) => <article key={title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div><h3>{title}</h3><p>{body}</p></div>
        </article>)}
      </section>

      <section className="rollerQualification">
        <div className="seedSectionHead">
          <div><div className="eyebrow">What earns advancement</div><h2>A title matters only when the work supports it.</h2></div>
          <p>A credible qualification considers sustained performance across multiple dimensions. One exceptional cigar does not establish mastery.</p>
        </div>
        <div className="qualificationGrid">{qualifications.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="qualityControl">
        <div>
          <div className="eyebrow">Quality makes the craft visible</div>
          <h2>The finished cigar is inspected, tested, and traceable.</h2>
          <p>In the documented Habanos process, supervisors oversee rolling teams; production trays identify the roller, vitola, and date; cigars are checked for construction and appearance; bunches are draw-tested; and samples may be opened to inspect their internal build and blend.</p>
          <a className="textLink" href="https://www.habanos.com/en/checking-the-work/" target="_blank" rel="noreferrer">Read the official Habanos quality-control account ↗</a>
        </div>
        <ul>{qualityChecks.map((check) => <li key={check}>{check}</li>)}</ul>
      </section>

      <section className="rollerComplexity">
        <div><span>Parejo foundations</span><strong>Straight-sided formats establish control and consistency.</strong></div>
        <i aria-hidden="true">→</i>
        <div><span>Demanding proportions</span><strong>Narrow, long, and large-ring cigars expose different construction challenges.</strong></div>
        <i aria-hidden="true">→</i>
        <div><span>Figurado mastery</span><strong>Tapers, curves, changing ring gauges, and complex finishing demand elite precision.</strong></div>
      </section>

      <section className="sourceStandard">
        <div>
          <div className="eyebrow">Cedriva source standard</div>
          <h2>Honor the craft without turning legend into fact.</h2>
        </div>
        <div>
          <p>When Cedriva describes a roller’s qualification, we identify whether the designation is official, historical, factory-specific, expert-reported, or promotional. We do not quietly convert one factory’s language into a universal industry standard.</p>
          <div className="sourceLinks">
            <a href="https://www.habanos.com/en/the-craft-of-the-torcedor/" target="_blank" rel="noreferrer"><span>Official source</span><strong>Habanos: The craft of the torcedor ↗</strong></a>
            <a href="https://www.miamiandbeaches.com/things-to-do/shopping/visit-cuban-cigar-shops-in-miami" target="_blank" rel="noreferrer"><span>Regional source</span><strong>Greater Miami: Cuban rolling tradition in Miami ↗</strong></a>
          </div>
        </div>
      </section>

      <section className="seedClosing">
        <div><div className="eyebrow">The collector’s role</div><h2>Knowledge turns consumption into stewardship.</h2></div>
        <div><p>When collectors understand the work behind tobacco, they store more carefully, ask better questions, recognize construction, value honest information, support the people behind the industry, and preserve stories that might otherwise disappear.</p><div className="ctaRow"><a className="button" href="/learn/blending">Continue to blending</a><a className="button secondary" href="/learn/manufacturing-truth">Meet the factories</a><a className="button secondary" href="/data-model">See how Cedriva preserves the record</a></div></div>
      </section>
    </main>
  );
}
