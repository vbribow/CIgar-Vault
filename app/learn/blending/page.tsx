import type { Metadata } from "next";
import "./blending.css";

export const metadata: Metadata = {
  title: "Blending & Master Blenders",
  description: "Learn how premium cigar blends are designed, tested, adapted, and protected—and study the documented work of influential master blenders.",
};

const blenderWork = [
  ["Define the intention", "The process begins with a purpose: an experience, a brand identity, a price and production target, or a tobacco story worth expressing. “Strong” or “mild” is not a complete brief."],
  ["Understand the leaf library", "Every lot has an identity—seed, farm, field, harvest, priming, curing, fermentation, age, texture, aroma, strength, combustion, and available quantity. Country alone says very little."],
  ["Taste components", "Blenders evaluate leaves alone, in simple test cigars, and in combinations. A leaf that is compelling by itself may dominate a finished cigar; a quiet leaf may solve burn, structure, or balance."],
  ["Build the architecture", "Wrapper, binder, and fillers must work as one system. The blender chooses proportions and placement while accounting for airflow, burn rate, density, combustion, and how the cigar will change as it is smoked."],
  ["Prototype and compare", "Trial blends are rolled under controlled instructions, rested, and compared—often repeatedly and, when useful, blind. The team records what changed instead of relying on memory or reputation."],
  ["Adapt the vitola", "A line is not always enlarged or reduced mechanically. Different geometry can require revised leaf counts, cuts, or proportions to preserve the intended identity without pretending every size will taste identical."],
  ["Prove repeatability", "A successful prototype must survive normal production. The factory documents materials, bunching, weight, draw, construction, rest, and quality checks so skilled teams can reproduce the intent."],
  ["Steward the blend", "Crops and inventories change. The blender protects identity by monitoring leaf development, reserving tobacco, managing substitutions honestly, and deciding when a blend should evolve, pause, or end."],
] as const;

const leafRoles = [
  ["Wrapper", "The outermost leaf must combine appearance, elasticity, durability, combustion, and flavor. It touches the mouth and has a high surface-area relationship in slender cigars, but no honest universal percentage can describe its contribution."],
  ["Binder", "The binder compresses and shapes the bunch, supports the wrapper, and helps manage airflow and burn. It combusts with every draw, so a distinctive binder can materially change aroma, sweetness, spice, body, and finish."],
  ["Filler", "Long-filler leaves form most of the cigar’s mass. Blenders arrange different primings and lots to manage combustion, strength, aroma, body, texture, and development from the foot to the head."],
] as const;

const primings = [
  ["Volado / lower plant", "Thinner, lower-strength leaves valued especially for easy combustion. They can keep slower-burning leaves in rhythm and contribute delicacy without being “empty.”"],
  ["Seco / middle plant", "Commonly associated with aroma and medium strength in the Cuban classification. Seco can carry fragrance, nuance, and continuity through a blend."],
  ["Viso / middle-upper plant", "A widely used term outside the Cuban system for leaves between seco and ligero. Often selected for a combination of flavor, structure, and moderate-to-full intensity; usage varies by producer."],
  ["Ligero / upper plant", "Thicker, more sun-exposed, slower-burning leaves commonly used for strength and concentrated flavor. Too much, poorly placed, can challenge combustion."],
  ["Medio tiempo / rare top leaves", "Occasional leaves above the ligero on some plants and crops. In the Cuban system they are the highest fortaleza and are used sparingly for added intensity."],
] as const;

const wrapperFamilies = [
  ["Connecticut Shade", "Cultivation style and tobacco family; it may be grown in Connecticut or elsewhere", "Cream, cedar, nuts, hay, gentle sweetness, soft pepper", "Pale color, mild nicotine, or U.S. origin"],
  ["Connecticut Broadleaf", "A broadleaf tobacco historically grown outdoors in the Connecticut River Valley; frequently fermented to a maduro presentation", "Earth, cocoa, dark sweetness, espresso, pepper, dense texture", "That every Broadleaf is maduro—or every maduro is Broadleaf"],
  ["Habano", "A seed-family or trade description rooted in Cuban tobacco heritage, usually paired with an actual growing origin", "Cedar, leather, earth, baking spice, pepper, natural sweetness", "Cuban origin or one fixed flavor"],
  ["Corojo", "A tobacco lineage/name historically associated with Cuban wrapper, now grown in several countries and expressed through many hybrids", "Red pepper, cedar, earth, leather, aromatic spice", "One genetic strain, country, strength, or processing method"],
  ["Cameroon", "Most usefully an origin designation for wrapper grown in Cameroon or the surrounding region", "Fragrant cedar, baking spice, toast, subtle sweetness, distinctive aromatic lift", "A color grade or a guarantee that every blend will be mild"],
  ["Sumatra", "A seed, style, or origin term whose meaning must be completed by the stated country—Ecuadorian Sumatra is common", "Earth, wood, savory spice, floral or dry sweetness", "That the tobacco was necessarily grown on Sumatra"],
  ["Mexican San Andrés", "An origin—Mexico’s San Andrés Valley—often seen as a dark or maduro wrapper", "Earth, cocoa, mineral character, coffee, pepper, dark sweetness", "Automatic strength, one seed, or one fermentation recipe"],
  ["Nicaraguan sun-grown", "An origin plus open-sun cultivation; region, seed, priming, and processing still matter", "Concentrated earth, cedar, pepper, coffee, sweetness, substantial texture", "That all Nicaraguan sun-grown leaf tastes alike"],
] as const;

const profileSources = [
  {
    initials: "JG",
    name: "José “Pepín” García",
    house: "My Father Cigars",
    verified: "My Father’s history identifies García as a third-generation Cuban master blender who rolled his first cigar at eleven and opened El Rey de los Habanos in Miami with Jaime and Janny García in 2003.",
    study: "Study the family’s movement from a small Miami factory to vertically connected farming and production in Nicaragua. The useful theme is not a single flavor adjective; it is the relationship between inherited Cuban craft, family apprenticeship, and control from seed through production.",
    project: "Start with the Don Pepin García and My Father lineages, then compare multiple vitolas while documenting construction, pace, and development.",
    source: "https://myfathercigars.com/about/",
    label: "Official My Father history",
  },
  {
    initials: "JG",
    name: "Jaime García",
    house: "My Father Cigars",
    verified: "The company records that Jaime developed the original My Father blend in 2008 and built it to honor his father. He works inside a family system that includes farms and factories in Nicaragua.",
    study: "His documented story is a valuable case study in second-generation authorship: respecting an established house language while creating a distinct blend with its own purpose and emotional origin.",
    project: "Compare the original My Father blend with another García family project. Separate what the company documents from the sensory patterns you personally observe.",
    source: "https://myfathercigars.com/about/",
    label: "Official My Father history",
  },
  {
    initials: "CF",
    name: "Carlos “Carlito” Fuente Jr.",
    house: "Arturo Fuente",
    verified: "Fuente’s family history credits Carlito Fuente with pursuing Dominican wrapper tobacco for Fuente Fuente OpusX, introduced as the company’s first successful all-Dominican cigar. Fuente also documents his revival of difficult perfecto forms in the Hemingway line.",
    study: "Two documented themes deserve study: expanding what an origin was believed capable of producing, and preserving demanding shapes because the making itself carries cultural value.",
    project: "Use OpusX to study agricultural ambition and the Hemingway line to study how shape, roller skill, and historical continuity interact.",
    source: "https://arturofuente.com/history/family-history/",
    label: "Official Fuente family history",
  },
  {
    initials: "NM",
    name: "Nicholas Melillo",
    house: "Foundation Cigar Company",
    verified: "Foundation describes Melillo as a tobacco sourcer and blender with more than two decades in production, including years working in Nicaragua, and records that he founded Foundation in 2015.",
    study: "His official company story places sourcing, Connecticut tobacco heritage, Nicaraguan production, old-world practice, modern craftsmanship, and cultural storytelling in the same frame.",
    project: "Compare a Foundation project rooted in Connecticut tobacco with one centered on Nicaraguan history. Ask how sourcing and story are made visible in the product—not merely in its marketing.",
    source: "https://foundationcigarcompany.com/about-foundation/",
    label: "Official Foundation biography",
  },
] as const;

const myths = [
  ["“The wrapper is most of the flavor.”", "Its influence matters, but the entire blend combusts together. Proportion, leaf chemistry, placement, construction, and the collector’s pace all shape perception."],
  ["“Darker means stronger.”", "Color is not a dependable strength scale. Seed, priming, growing conditions, fermentation, and blend proportion are more informative."],
  ["“Country tells you the taste.”", "Origin is only a beginning. Region, soil, seed, farm practice, priming, crop year, processing, and age distinguish leaves grown within the same country."],
  ["“The recipe is the blend.”", "A list of leaf origins omits the specific lots, preparation, proportions, placement, rolling specification, rest, quality control, and judgment required to reproduce an experience."],
  ["“Every vitola is identical inside.”", "A blender may adapt proportions or leaf configuration to the geometry. A shared line identity does not guarantee an identical formula or experience."],
  ["“More age fixes the cigar.”", "Rest can integrate a sound blend and soften transitional characteristics. It cannot reliably repair poor combustion, imbalance, or defective tobacco."],
] as const;

export default function BlendingPage() {
  return (
    <main className="shell blendingPage">
      <section className="blendingHero">
        <div>
          <div className="eyebrow">Cedriva Learn · Blending & Blenders</div>
          <h1>A blend is a system of relationships.</h1>
          <p className="lede">A master blender does not simply choose good-tasting leaves. The work connects agriculture, sensory memory, combustion, construction, inventory, people, and time—then makes that intention repeatable.</p>
          <div className="ctaRow"><a className="button" href="#process">Follow the process</a><a className="button secondary" href="#profiles">Study the blenders</a></div>
        </div>
        <aside className="blendLedger">
          <span>One finished cigar</span>
          <div><strong>Intent</strong><i>What should this experience express?</i></div>
          <div><strong>Leaf</strong><i>Which exact lots can carry that intent?</i></div>
          <div><strong>Structure</strong><i>How will they burn and develop together?</i></div>
          <div><strong>People</strong><i>Can the factory reproduce it with integrity?</i></div>
          <div><strong>Time</strong><i>When is it ready—and can it endure?</i></div>
        </aside>
      </section>

      <section className="blendDefinition">
        <div><div className="eyebrow">The blender’s real responsibility</div><h2>Design an experience the factory can honestly sustain.</h2></div>
        <div><p>The romantic moment of selecting a final prototype is only one part of the job. A blend must use tobacco that exists in sufficient quantity, behaves predictably in construction, reaches the intended cost, rests into balance, and can be produced consistently by trained people.</p><p>Great blending therefore joins creative judgment with agricultural knowledge, manufacturing discipline, and stewardship of finite leaf inventories.</p></div>
      </section>

      <section className="blenderProcess" id="process">
        <div className="blendSectionHead"><div><div className="eyebrow">From intention to repeatability</div><h2>Eight responsibilities behind the blend.</h2></div><p>There is no universal factory sequence, and titles differ across companies. This framework describes the work without pretending every respected blender follows one ritual.</p></div>
        <div className="processGrid">{blenderWork.map(([title,body],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="leafArchitecture">
        <div><div className="eyebrow">Inside the cigar</div><h2>Every layer has sensory and structural work to do.</h2><p>Wrapper, binder, and filler are useful roles—not a ranking of importance. The finished experience emerges from how the leaves interact while burning.</p></div>
        <div>{leafRoles.map(([title,body])=><article key={title}><span>{title.slice(0,1)}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
      </section>

      <section className="tasteEquation" id="leaf-taste">
        <div className="blendSectionHead"><div><div className="eyebrow">Where tobacco character comes from</div><h2>A leaf name is never the whole answer.</h2></div><p>The taste of one leaf is the accumulated result of biology, place, position, labor, transformation, and use. Change any one of these and the same familiar name can behave differently.</p></div>
        <div className="tasteEquationFlow" aria-label="Factors that shape tobacco character">
          {[
            ["Seed","Genetic potential"],
            ["Terroir","Soil, climate, field"],
            ["Priming","Position on plant"],
            ["Cultivation","Sun, shade, farm practice"],
            ["Curing","Moisture and color change"],
            ["Fermentation","Refinement and transformation"],
            ["Age","Integration and development"],
            ["Blend role","Wrapper, binder, filler"],
          ].map(([title,body],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
        <p className="tasteEquationNote">Even then, construction, ring gauge, humidity, combustion temperature, smoking pace, and the collector’s own perception shape what reaches the palate.</p>
      </section>

      <section className="primingLesson">
        <div><div className="eyebrow">The vertical leaf library</div><h2>Position on the plant changes the raw material.</h2><p>Upper leaves generally receive more sun, grow thicker, contain more oils and nicotine, and burn more slowly. Lower leaves tend to be thinner, lighter in strength, and more combustible. These are working tendencies—not substitutes for tasting the actual lot.</p><a className="textLink" href="https://www.habanos.com/en/the-anatomy-of-a-habano/" target="_blank" rel="noreferrer">Official Habanos leaf anatomy ↗</a></div>
        <div className="primingStack">{primings.map(([name,body],index)=><article key={name}><span>{5-index}</span><div><h3>{name}</h3><p>{body}</p></div></article>)}</div>
      </section>

      <section className="sunShadeLesson">
        <div className="blendSectionHead"><div><div className="eyebrow">Cultivation changes the leaf</div><h2>Shade-grown and sun-grown describe farming—not flavor grades.</h2></div><p>They tell you how light reached the plant. Seed, location, priming, curing, fermentation, and the rest of the blend determine what that cultivation becomes in the cigar.</p></div>
        <div className="sunShadeCompare">
          <article>
            <span>Filtered light</span>
            <h3>Shade-grown</h3>
            <p>Cloth or natural cloud cover reduces and diffuses direct sunlight. Under traditional cloth shade, plants tend to produce larger, thinner, finer-textured, more elastic leaves with smaller veins—qualities prized for wrapper.</p>
            <h4>Common sensory associations</h4>
            <p>Cream, cedar, hay, nuts, gentle sweetness, and refined spice are often associated with Connecticut-style shade wrappers. They are tendencies, not promises, and shade-grown tobacco can still be flavorful or strong.</p>
          </article>
          <article>
            <span>Direct light</span>
            <h3>Sun-grown</h3>
            <p>Plants mature in open sunlight. The leaf commonly becomes thicker, oilier, more textured, and physically robust, with the capacity for greater concentration. It usually requires careful curing and fermentation.</p>
            <h4>Common sensory associations</h4>
            <p>Earth, cedar, pepper, leather, coffee, and concentrated sweetness are common descriptions. Sun-grown does not automatically mean dark, maduro, full-strength, or better.</p>
          </article>
        </div>
        <div className="sourceRail"><a href="https://www.habanos.com/en/the-perfect-leaf/" target="_blank" rel="noreferrer">Habanos: shade wrapper vs. sun filler and binder ↗</a><a href="https://portal.ct.gov/-/media/CAES/DOCUMENTS/Publications/Bulletins/B364pdf.pdf" target="_blank" rel="noreferrer">Connecticut Agricultural Experiment Station: shade and outdoor tobacco ↗</a></div>
      </section>

      <section className="maduroLesson">
        <div>
          <div className="eyebrow">Processing, not a single plant</div>
          <h2>What is a Maduro?</h2>
          <p className="lede">Maduro means “mature” or “ripe.” In premium cigars it describes leaf—usually wrapper—that has been deliberately developed through selection, curing, fermentation, and aging into a dark, mature presentation.</p>
        </div>
        <div className="maduroTruths">
          <article><strong>It is not one seed.</strong><p>Broadleaf, San Andrés, Habano-family, and other sufficiently durable tobaccos can become maduro through producer-specific methods.</p></article>
          <article><strong>It is not merely a color.</strong><p>Authentic maturation changes aroma, texture, combustibility, harsh compounds, and perceived sweetness. Dye or a dark color alone does not create those qualities.</p></article>
          <article><strong>It is not automatically strong.</strong><p>A dark wrapper may taste rich while the complete blend remains moderate in nicotine. Color, flavor concentration, body, and strength are separate observations.</p></article>
          <article><strong>It is not one flavor.</strong><p>Collectors often perceive cocoa, coffee, earth, dark fruit, molasses-like sweetness, or pepper—but origin, seed, priming, fermentation, and blend architecture decide the result.</p></article>
        </div>
        <div className="maduroProcess"><span>Selected resilient leaf</span><i>→</i><span>Controlled curing</span><i>→</i><span>Extended or intensified fermentation</span><i>→</i><span>Rest and aging</span><i>→</i><span>Dark, mature wrapper</span></div>
        <p className="maduroCaution">There is no universal Maduro timetable or temperature. Producers protect different methods, and the leaf—not a marketing color target—must guide the process.</p>
        <div className="sourceRail"><a href="https://store.davidoffgeneva.com/" target="_blank" rel="noreferrer">Davidoff: “Maduro is not color only” ↗</a><a href="https://www.perdomocigars.com/10th-anniversary" target="_blank" rel="noreferrer">Perdomo: Connecticut, sun-grown, and Maduro blend examples ↗</a></div>
      </section>

      <section className="wrapperLibrary">
        <div className="blendSectionHead"><div><div className="eyebrow">A collector’s wrapper library</div><h2>Learn what the name tells you—and what it does not.</h2></div><p>The taste language below records common collector and producer associations, not a flavor guarantee. A careful cigar record preserves the complete identity whenever it is available.</p></div>
        <div className="wrapperTable">
          <div className="wrapperTableHead"><span>Name</span><span>What it may identify</span><span>Common associations</span><span>Never assume</span></div>
          {wrapperFamilies.map(([name,meaning,taste,caution])=><article key={name}><h3>{name}</h3><p data-label="What it may identify">{meaning}</p><p data-label="Common associations">{taste}</p><p data-label="Never assume">{caution}</p></article>)}
        </div>
      </section>

      <section className="binderDeepDive">
        <div><div className="eyebrow">The misunderstood middle</div><h2>The binder is part of the flavor system.</h2><p>Because it is hidden, binder is often described only as structural. But it is a full tobacco leaf burning directly beneath the wrapper and around the entire filler bunch.</p></div>
        <div className="binderQuestions">
          <article><h3>Why choose one?</h3><p>Elasticity, tensile strength, thickness, combustion rate, neutral or distinctive flavor, compatibility with the wrapper, and the ability to hold the bunch at the intended density.</p></article>
          <article><h3>How can it change taste?</h3><p>A binder may reinforce sweetness, add earth or spice, dry the finish, deepen body, or calm an assertive filler. Its effect depends on the particular leaf and its relationship to the entire blend.</p></article>
          <article><h3>Can there be two?</h3><p>Some cigars use dual binders to solve structural, combustion, or sensory goals. “Double binder” describes construction; it does not guarantee greater strength or quality.</p></article>
          <article><h3>How much flavor?</h3><p>No defensible fixed percentage applies to every cigar. Ring gauge, leaf thickness, chemistry, proportions, burn temperature, and the other components continually change the relationship.</p></article>
        </div>
      </section>

      <section className="wrapperExperiment">
        <div><div className="eyebrow">The most useful tasting exercise</div><h2>Change one wrapper. Observe the whole system.</h2></div>
        <div><p>Find a producer offering Connecticut, sun-grown, and Maduro versions built around closely related binder and filler tobaccos. Smoke the same vitola under similar conditions. Record aroma before lighting, first-light character, sweetness, spice, body, nicotine strength, texture, combustion, transitions, and finish.</p><p>The goal is not to prove that the wrapper supplies a percentage of flavor. It is to notice how changing one leaf changes the relationships among every leaf.</p><a className="textLink" href="https://www.perdomocigars.com/10th-anniversary" target="_blank" rel="noreferrer">Study an official three-wrapper comparison ↗</a></div>
      </section>

      <section className="strengthLanguage">
        <div><div className="eyebrow">Use precise language</div><h2>Strength, body, and flavor are not synonyms.</h2></div>
        <div className="languageCards">
          <article><h3>Strength</h3><p>The perceived physiological intensity of nicotine. It can change through a cigar and is affected by the blend, pace, food, and individual sensitivity.</p></article>
          <article><h3>Body</h3><p>The perceived weight, concentration, or fullness of the smoke. Collectors use the term differently, so describe what produced that impression.</p></article>
          <article><h3>Flavor</h3><p>The aromas, tastes, textures, and associations a collector perceives. More flavor does not automatically mean more nicotine strength.</p></article>
          <article><h3>Balance</h3><p>Not blandness and not equal intensity. It is the experienced relationship among the blend’s elements, without one unintended trait overwhelming the purpose.</p></article>
        </div>
      </section>

      <section className="styleStandard">
        <div><div className="eyebrow">How Cedriva discusses style</div><h2>A blender is more than a tasting-note stereotype.</h2></div>
        <div><p>A useful profile studies repeated, documented choices: origins and farms, fermentation and age, preferred structures, vitola adaptation, production philosophy, cultural influences, and the intentions behind named projects.</p><blockquote>“Style” is a pattern worth investigating—not a permanent label Cedriva assigns to a person.</blockquote><p>When Cedriva describes a sensory pattern, it will identify whether that description comes from the producer, an expert source, community records, or our editorial analysis.</p></div>
      </section>

      <section className="blenderProfiles" id="profiles">
        <div className="blendSectionHead"><div><div className="eyebrow">The living blender archive · First profiles</div><h2>Study people through documented work.</h2></div><p>This is not a ranking or a hall of fame. It is the beginning of an expandable, sourced library honoring the people, teams, and traditions behind influential cigars.</p></div>
        <div className="profileGrid">{profileSources.map((profile)=><article key={profile.name}>
          <header><span>{profile.initials}</span><div><small>{profile.house}</small><h3>{profile.name}</h3></div></header>
          <dl>
            <div><dt>Verified record</dt><dd>{profile.verified}</dd></div>
            <div><dt>What to study</dt><dd>{profile.study}</dd></div>
            <div><dt>Collector fieldwork</dt><dd>{profile.project}</dd></div>
          </dl>
          <a href={profile.source} target="_blank" rel="noreferrer">{profile.label} ↗</a>
        </article>)}</div>
        <div className="profilePolicy"><strong>Profile standard</strong><p>Biographical facts require attributable sources. Company claims are labeled as company claims. Cedriva analysis is labeled as analysis. Sensory reputation is never presented as biography, and living craft is never reduced to an unsourced legend.</p></div>
      </section>

      <section className="readingBlend">
        <div><div className="eyebrow">How to read a blend</div><h2>Replace the ingredient list with better questions.</h2></div>
        <ol>
          <li><span>01</span><p><strong>Identity:</strong> Are the seed, country, region, farm, crop, priming, and processing actually documented—or only a country named?</p></li>
          <li><span>02</span><p><strong>Purpose:</strong> What did the producer say the project was meant to express, commemorate, or solve?</p></li>
          <li><span>03</span><p><strong>Architecture:</strong> How might the listed wrapper, binder, fillers, proportions, and vitola cooperate in combustion?</p></li>
          <li><span>04</span><p><strong>Evidence:</strong> Which details are official, historically verified, expert interpretation, community experience, or AI-assisted insight?</p></li>
          <li><span>05</span><p><strong>Your experience:</strong> What changed through the cigar, and what did you observe rather than expect from the band or reputation?</p></li>
        </ol>
      </section>

      <section className="blendMyths">
        <div className="eyebrow">Protect curiosity from shortcuts</div>
        <h2>Six blending myths to leave behind.</h2>
        <div>{myths.map(([claim,answer])=><article key={claim}><strong>{claim}</strong><p>{answer}</p></article>)}</div>
      </section>

      <section className="blendExercise">
        <div><div className="eyebrow">Collector exercise</div><h2>Compare with purpose.</h2></div>
        <div><p>Choose two vitolas from the same line. Record their exact dimensions, storage condition, cut, draw, pace, smoke texture, perceived strength, body, flavor development, combustion, and finish. Do not begin by deciding which is “better.” Ask what each format reveals about the blend.</p><div className="ctaRow"><a className="button" href="/records">Create a tasting record</a><a className="button secondary" href="/learn/vitolas">Review vitolas</a></div></div>
      </section>
    </main>
  );
}
