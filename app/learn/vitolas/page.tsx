import type { Metadata } from "next";
import "./vitolas.css";

export const metadata: Metadata = {
  title: "Understanding Vitolas",
  description: "Learn how cigar length, ring gauge, shape, factory names, and commercial names work—and how vitola changes construction and the smoking experience.",
};

const commonVitolas = [
  { name: "Petit Corona", measure: "About 4½ × 40–42", length: 58, gauge: 18, note: "Compact, traditional proportions with a relatively high wrapper-to-filler relationship." },
  { name: "Robusto", measure: "About 5 × 48–52", length: 64, gauge: 28, note: "A short, substantial format that became a modern reference point for comparing blends." },
  { name: "Corona", measure: "About 5½ × 42–44", length: 72, gauge: 20, note: "A classic proportion that balances wrapper influence, filler development, and manageable length." },
  { name: "Corona Gorda", measure: "About 5⅝ × 46", length: 76, gauge: 23, note: "Wider than a traditional corona while retaining a focused, elegant proportion." },
  { name: "Toro", measure: "About 6 × 50–54", length: 82, gauge: 30, note: "More tobacco and time than a robusto, with enough width to support a complex filler arrangement." },
  { name: "Lonsdale", measure: "About 6½ × 42–44", length: 89, gauge: 20, note: "Long and relatively slender, rewarding precise bunching and careful combustion." },
  { name: "Churchill", measure: "About 7 × 47–50", length: 96, gauge: 25, note: "A long format that gives a blend room to develop, but demands consistency throughout the bunch." },
  { name: "Lancero", measure: "About 7–7½ × 36–40", length: 100, gauge: 15, note: "Long, narrow, wrapper-forward, and unforgiving of construction errors." },
  { name: "Gordo", measure: "Often about 6 × 58–60", length: 82, gauge: 36, note: "A large-ring format requiring more filler tobacco and thoughtful blend adjustment." },
] as const;

const figurados = [
  ["Belicoso", "Usually a parejo body with a shorter tapered head. The narrowing head lets the collector choose a smaller or wider cut."],
  ["Torpedo", "A long taper toward a pointed head. Usage varies by manufacturer, so the stated dimensions matter more than the name alone."],
  ["Pyramid", "Broad at the foot and progressively narrower toward the head, changing the tobacco proportions along the cigar."],
  ["Perfecto", "Tapered at both ends, commonly with a closed or narrow foot and a fuller center. Lighting and early combustion feel different from a parejo."],
  ["Salomón", "A large, dramatic double figurado whose curves and changing diameter require advanced rolling skill."],
  ["Culebra", "Several narrow cigars formed in a twisted presentation. Each strand is separated before smoking."],
] as const;

const experienceFactors = [
  ["Wrapper proportion", "A narrower cigar generally places more wrapper surface in relation to the filler. That may make wrapper character more noticeable, but it does not make the wrapper solely responsible for flavor."],
  ["Filler architecture", "A wider ring gauge gives the blender room for more leaves or different proportions. The blend may be deliberately adjusted rather than simply enlarged."],
  ["Combustion", "Diameter, bunch density, tobacco placement, humidity, pace, and construction all influence heat, airflow, and burn behavior."],
  ["Development", "Length can create more time for a cigar to evolve, but smoking duration is never guaranteed; tobacco, construction, environment, and the collector’s pace matter."],
  ["Cut and draw", "A tapered head allows the opening to be adjusted through the depth of the cut. Removing too much can compromise the cap and wrapper."],
  ["Roller difficulty", "Long, thin, tapered, curved, and changing-diameter shapes expose errors quickly and require greater control of density and alignment."],
] as const;

export default function VitolasPage() {
  return (
    <main className="shell vitolasPage">
      <section className="vitolaHero">
        <div>
          <div className="eyebrow">Cedriva Learn · Vitolas</div>
          <h1>Shape changes more than appearance.</h1>
          <p className="lede">A vitola describes a cigar’s physical format: its length, ring gauge, and shape. Those dimensions influence how a blend is constructed, how it burns, and how the collector encounters it.</p>
          <div className="ctaRow"><a className="button" href="#measure">Learn to read the measurements</a><a className="button secondary" href="#compare">Compare common vitolas</a></div>
        </div>
        <figure className="vitolaHeroPhoto">
          <img src="/learn/vitolas/wide-churchill.jpg" alt="A wide Churchill cigar photographed against a dark background"/>
          <figcaption><strong>Length × ring gauge</strong><span>A Wide Churchill measuring 130 mm with a 55 ring gauge.</span><a href="https://commons.wikimedia.org/wiki/File:Romeo_y_Julieta_-_Wide_Churchill.jpg" target="_blank" rel="noreferrer">Photo: Christoph Braun · CC0 ↗</a></figcaption>
        </figure>
      </section>

      <section className="vitolaDefinition">
        <div><div className="eyebrow">Begin with the precise meaning</div><h2>Vitola is a format—not a measure of quality or strength.</h2></div>
        <div><p>In general collector use, vitola means the combination of size and shape. In the Cuban system, <em>vitola de galera</em> is the factory format name, while <em>vitola de salida</em> is the commercial name used for a particular cigar.</p><p>That distinction matters because two brands may sell the same factory format under different names—and two manufacturers may use the same familiar name for different dimensions.</p><a className="textLink" href="https://www.habanos.com/es/glossary/vitola/" target="_blank" rel="noreferrer">Official Habanos vitola definition ↗</a></div>
      </section>

      <section className="measureSection" id="measure">
        <div className="vitolaSectionHead"><div><div className="eyebrow">How measurements work</div><h2>Always trust the dimensions before the nickname.</h2></div><p>A listing such as <strong>6 × 52</strong> means the cigar is six inches long and has a ring gauge of 52/64 of an inch.</p></div>
        <div className="measurementCards">
          <article><span>6″</span><h3>Length</h3><p>Measured from the head to the foot, normally stated in inches in the United States and millimeters in many other markets.</p></article>
          <article><span>52</span><h3>Ring gauge</h3><p>Diameter expressed in sixty-fourths of an inch. A 52 ring is 52/64 inch—approximately 0.8125 inch or 20.6 mm.</p></article>
          <article><span>6 × 52</span><h3>Complete format</h3><p>Dimensions identify the physical format more reliably than “Toro,” because commercial naming is not perfectly standardized.</p></article>
        </div>
        <div className="ringGaugeScale" aria-label="Ring gauge comparison from 38 to 60">
          {[38,42,46,50,54,60].map((gauge)=><div key={gauge}><i style={{width:`${Math.round(gauge*.72)}px`,height:`${Math.round(gauge*.72)}px`}}/><strong>{gauge}</strong><span>{(gauge/64*25.4).toFixed(1)} mm</span></div>)}
        </div>
      </section>

      <section className="parejoFigurado">
        <article><div className="eyebrow">The two great families</div><h2>Parejos</h2><p>Straight-sided cigars with a consistent ring gauge along most of the body. The head is normally rounded and capped; the foot is usually open. Coronas, robustos, toros, Churchills, and lanceros are common parejo forms.</p></article>
        <article><div className="eyebrow">Construction with changing geometry</div><h2>Figurados</h2><p>Cigars whose form departs from the straight-sided cylinder. Tapers, points, curves, closed feet, and changing diameters affect bunching, wrapper application, cutting, lighting, and combustion.</p></article>
      </section>

      <section className="shapePhoto">
        <figure><img src="/learn/vitolas/cigar-shapes.png" alt="Comparison showing parejo, torpedo, pyramid, perfecto, and presidente cigar shapes"/><figcaption><strong>Five recognizable silhouettes</strong><span>Parejo, torpedo, pyramid, perfecto, and presidente.</span><a href="https://commons.wikimedia.org/wiki/File:Cigarshapes1.png" target="_blank" rel="noreferrer">Image: Hellahulla · CC BY-SA ↗</a></figcaption></figure>
        <div><div className="eyebrow">Learn the silhouette</div><h2>The shape tells you where construction becomes difficult.</h2><p>A straight body asks for uniform density. A taper asks the roller to change diameter without blocking airflow. A curved double figurado must transition through several proportions while maintaining the intended blend and burn.</p><blockquote>Shape is the visible record of decisions made inside the bunch.</blockquote></div>
      </section>

      <section className="commonVitolas" id="compare">
        <div className="vitolaSectionHead"><div><div className="eyebrow">A practical comparison</div><h2>Common names, approximate proportions.</h2></div><p>These are useful reference ranges—not universal laws. Always record the manufacturer’s stated dimensions with the commercial vitola name.</p></div>
        <div className="vitolaRows">{commonVitolas.map((item)=><article key={item.name}>
          <div><h3>{item.name}</h3><span>{item.measure}</span></div>
          <div className="cigarScale"><i style={{width:`${item.length}%`,height:`${item.gauge}px`}}/></div>
          <p>{item.note}</p>
        </article>)}</div>
      </section>

      <section className="photoStudy">
        <figure><img src="/learn/vitolas/parejo-comparison.jpg" alt="Three straight-sided Padrón cigars shown together for comparison"/><figcaption><strong>Similarity does not mean sameness</strong><span>Three parejo cigars show differences in length, diameter, finish, and presentation.</span><a href="https://commons.wikimedia.org/wiki/File:Padroncigars.jpg" target="_blank" rel="noreferrer">Photo: Magnetic Rag · Public domain ↗</a></figcaption></figure>
        <figure><img src="/learn/vitolas/culebras.jpg" alt="Three narrow twisted Culebra cigars tied together with red ribbon"/><figcaption><strong>Culebra</strong><span>Three narrow cigars formed and presented together, then separated before smoking.</span><a href="https://commons.wikimedia.org/wiki/File:Partag%C3%A1s_Culebras_edit.jpg" target="_blank" rel="noreferrer">Photo: Christoph Braun · CC0 ↗</a></figcaption></figure>
      </section>

      <section className="figuradoGuide">
        <div className="vitolaSectionHead"><div><div className="eyebrow">Figurado vocabulary</div><h2>Names describe families, not perfectly fixed specifications.</h2></div><p>Manufacturers and markets sometimes use these words differently. Cedriva records both the stated name and the measurable shape.</p></div>
        <div>{figurados.map(([name,description],index)=><article key={name}><span>0{index+1}</span><h3>{name}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="vitolaExperience">
        <div><div className="eyebrow">How vitola changes the experience</div><h2>Geometry changes relationships within the blend.</h2><p>Size does not mechanically determine strength, quality, or flavor. It changes the physical system the blender and roller must manage.</p></div>
        <div className="experienceGrid">{experienceFactors.map(([title,body])=><article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="vitolaMyths">
        <div className="eyebrow">Avoid the shortcuts</div>
        <h2>Four statements a careful collector should question.</h2>
        <div>
          <article><strong>“A larger ring gauge is stronger.”</strong><p>Strength depends on the tobaccos and their proportions, not diameter alone.</p></article>
          <article><strong>“Every Toro is 6 × 50.”</strong><p>Toro is a commercial convention. Actual dimensions vary across producers.</p></article>
          <article><strong>“Every size uses the identical blend.”</strong><p>Blenders may adjust leaf proportions to preserve a line’s intended character across formats.</p></article>
          <article><strong>“A longer cigar always lasts a fixed time.”</strong><p>Pace, ring gauge, tobacco, construction, humidity, and environment prevent a guaranteed duration.</p></article>
        </div>
      </section>

      <section className="vitolaClosing">
        <div><div className="eyebrow">Collect with precision</div><h2>Record the name. Trust the measurements. Notice the experience.</h2></div>
        <div><p>When comparing two vitolas from the same line, document length, ring gauge, shape, cut, draw, smoking pace, and where the profile changed. Over time, your journal will reveal which proportions best suit your preferences.</p><div className="ctaRow"><a className="button" href="/records">Begin a tasting record</a><a className="button secondary" href="/learn/seed-to-smoke">Return to Seed to Smoke</a></div></div>
      </section>
    </main>
  );
}
