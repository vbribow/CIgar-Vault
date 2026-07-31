import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Cigar strength, body, and nicotine | ${brand.name}`,
  description: "Collector guidance for separating flavor intensity, smoke body, producer strength labels, nicotine exposure, and physical response.",
};

const recordLayers = [
  ["Producer classification", "Exact published strength or flavor category, source, date, product scope, and whether the maker defines its scale."],
  ["Sensory intensity", "Flavor and aroma intensity under an anchored personal scale, with descriptors kept separate from intensity."],
  ["Smoke body", "Texture, density, and mouth-filling impression under a clearly defined scale rather than a synonym for strength."],
  ["Use conditions", "Cigar size, duration, pace, inhalation as reported, food, hydration, alcohol or other substances, environment, and prior exposure."],
  ["Physical response", "Timing and description of symptoms or effects, what action was taken, and whether care was sought—without diagnosing the cause."],
] as const;

export default function CigarStrengthBodyNicotinePage() {
  return <main className="shell learnPage">
    <nav className="nav"><a className="brand" href="/">{brand.name}</a><div className="navLinks"><a href="/learn">Learn</a><a href="/records">Tasting records</a><a href="/data-model">Data model</a></div></nav>
    <section className="learnHero"><div><div className="eyebrow">Experience and safety</div><h1>Name the sensation. Do not invent the dose.</h1><p className="lede">Flavor intensity, smoke body, producer strength, nicotine exposure, and physical response answer different questions. Record them separately so personal experience never becomes false chemical certainty.</p><div className="ctaRow"><a className="button" href="/records">Open tasting records</a><a className="button secondary" href="/learn/cigar-wrapper-colors">Review wrapper-color claims</a></div></div><aside><span>The collector rule</span><blockquote>A “full-strength” label is not a measured nicotine dose.</blockquote><small>Physical distress is a safety signal—not a quality score or badge of expertise.</small></aside></section>
    <section className="section"><div className="sectionHead"><div><div className="eyebrow">Private record fields</div><h2>Separate the experience before comparing it.</h2><p>Context and individual response can change from one occasion to another. Preserve conditions and uncertainty rather than declaring a permanent product verdict.</p></div></div><div className="learningPathways">{recordLayers.map(([title,body],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="section card"><div className="eyebrow">Stop when symptoms begin</div><h2>Do not push through a physical reaction.</h2><p>Stop smoking and move away from the smoke if nausea, dizziness, headache, weakness, confusion, breathing difficulty, or other concerning symptoms occur. Severe or persistent symptoms—especially chest pain, breathing difficulty, confusion, fainting, seizure, or inability to wake—require urgent medical help.</p><div className="ctaRow"><a className="button secondary" href="/learn/tasting-vocabulary-calibration">Build a calibrated tasting vocabulary</a></div></section>
  </main>;
}
