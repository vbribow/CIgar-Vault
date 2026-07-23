import type { Metadata } from "next";
export const metadata:Metadata={title:"Learn",description:"Build premium cigar knowledge through welcoming, contextual learning that grows from beginner foundations to lifelong mastery."};
const pathways=[
  ["The Curious","Start without intimidation","How to choose, cut, light, enjoy, and store a first premium cigar."],
  ["The Explorer","Develop your own palate","Flavor, strength, wrappers, origins, journals, and thoughtful comparison."],
  ["The Enthusiast","Collect with intention","Humidors, aging, releases, factories, construction, and collection goals."],
  ["The Collector","Protect what you’ve built","Provenance, authenticity, market evidence, insurance, and stewardship."],
  ["The Connoisseur","Contribute what you know","Expert review, teaching, mentorship, history, and community leadership."],
  ["The Legacy Collector","Preserve a lifetime","Collection timelines, permanent records, estate continuity, and legacy."],
] as const;
export default function LearnPage(){return <main className="shell learnPage">
  <section className="learnHero"><div><div className="eyebrow">Cedriva Learn</div><h1>Every expert was once a beginner.</h1><p className="lede">Learn in the moment you need it. Cedriva reveals depth as your curiosity grows, welcomes every question, and respects the knowledge you already carry.</p><div className="ctaRow"><a className="button" href="#pathways">Find my pathway</a><a className="button secondary" href="/sommelier-library">Explore trusted knowledge</a></div></div><aside><span>Our promise</span><blockquote>Knowledge should never intimidate. Questions should always be welcomed.</blockquote><small>Learning is not a gate to the culture. It is how the culture grows.</small></aside></section>
  <section className="section" id="pathways"><div className="sectionHead"><div><div className="eyebrow">Learning that grows with you</div><h2>Choose the depth that feels useful today.</h2></div></div><div className="learningPathways">{pathways.map(([stage,title,body],index)=><article key={stage}><span>{String(index+1).padStart(2,"0")}</span><div><small>{stage}</small><h3>{title}</h3><p>{body}</p></div></article>)}</div></section>
  <section className="learningInContext"><div><div className="eyebrow">Every page should teach something</div><h2>Learning belongs inside the experience.</h2><p>A cigar record can explain a wrapper. A humidor alert can teach collection care. A review can develop tasting vocabulary. A market signal can explain evidence and uncertainty.</p></div><div><a href="/catalog"><span>Cigar reference</span><strong>Learn through documented identity →</strong></a><a href="/records"><span>Guided tasting</span><strong>Learn through your own experience →</strong></a><a href="/cigar-somm"><span>Cedriva AI</span><strong>Ask without embarrassment →</strong></a></div></section>
</main>}
