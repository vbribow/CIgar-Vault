import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Cigar wrapper colors | ${brand.name}`,
  description: "Collector guidance for separating visible wrapper color, producer labels, tobacco identity, process claims, and observed flavor.",
};

const recordLayers = [
  ["Direct observation", "Color under neutral light, sheen, visible variation, surface condition, date, and whether you examined the cigar or a photograph."],
  ["Producer designation", "The exact term used—such as natural, claro, colorado, maduro, rosado, oscuro, or shade—plus its source and product scope."],
  ["Wrapper identity", "Country, region, cultivar or seed claim, cultivation method, leaf position, and tobacco type only where separately supported."],
  ["Process claim", "Curing, fermentation, aging, sorting, coloring, or other treatment exactly as disclosed, with unknown left unresolved."],
  ["Smoking evidence", "Construction, aroma, flavor, body, perceived strength, conditions, and personal response recorded independently from appearance."],
] as const;

export default function CigarWrapperColorsPage() {
  return <main className="shell learnPage">
    <nav className="nav"><a className="brand" href="/">{brand.name}</a><div className="navLinks"><a href="/learn">Learn</a><a href="/records">Tasting records</a><a href="/data-model">Data model</a></div></nav>
    <section className="learnHero"><div><div className="eyebrow">Wrapper evidence</div><h1>See the color. Do not taste with your eyes.</h1><p className="lede">A dark wrapper is not automatically stronger, sweeter, older, or more fermented. Record appearance, producer terminology, tobacco identity, processing, and the smoking experience as separate evidence.</p><div className="ctaRow"><a className="button" href="/records">Open tasting records</a><a className="button secondary" href="/learn/tobacco-seed-varietals">Review seed and varietal claims</a></div></div><aside><span>The collector rule</span><blockquote>Color is observable. Flavor must be experienced.</blockquote><small>One producer’s shade vocabulary or process does not become a universal cigar standard.</small></aside></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Private record fields</div><h2>Preserve the layers behind the wrapper.</h2><p>Traditional shade names can describe a visual category, product variant, tobacco, or process. Keep each layer attached to its source instead of completing the story from color.</p></div></div><div className="learningPathways">{recordLayers.map(([title,body],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="section card"><div className="eyebrow">Comparison discipline</div><h2>Compare complete cigars—not color chips.</h2><p>When evaluating wrapper influence, hold the line, size, storage, preparation, pace, and environment as steady as practical. Note what changed, preserve the producer’s disclosed components, and keep personal sensory results separate from claims about genetics or manufacturing.</p><div className="ctaRow"><a className="button secondary" href="/learn/cigar-strength-body-nicotine">Separate strength, body, and nicotine response</a></div></section>
  </main>;
}
