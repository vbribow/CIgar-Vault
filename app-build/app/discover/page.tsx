import type { Metadata } from "next";
export const metadata:Metadata={title:"Discover",description:"Discover premium cigars through stories, trusted knowledge, collector goals, and the people and places behind the craft."};
const intentions=[
  ["I’m new to premium cigars","Learn the essentials without judgment, then find a comfortable place to begin.","/learn","Begin with confidence"],
  ["I want to try something new","Explore through occasion, flavor, strength, maker, region, and the experience you want.","/catalog","Explore the cigar reference"],
  ["I’m building with purpose","Connect discovery to collection goals, aging plans, wish lists, and what you already enjoy.","/wishlist","Shape my wish list"],
] as const;
const trustLevels=[
  ["01","Official","Verified information supplied directly by a manufacturer."],
  ["02","Verified Historical","Information confirmed through multiple trusted sources."],
  ["03","Expert","Knowledge contributed by a verified expert or independent publication."],
  ["04","Community","Collector reviews, tasting notes, questions, and lived experience."],
  ["05","AI","Clearly identified guidance generated from trusted Cedriva knowledge."],
] as const;
export default function DiscoverPage(){return <main className="shell discoverPage">
  <section className="discoverHero"><div><div className="eyebrow">Cedriva Discover</div><h1>Find the next meaningful cigar.</h1><p className="lede">Start with who you are, what you want to experience, or what you hope to learn. Cedriva connects every recommendation to story, context, and visible sources—not an advertising feed.</p><div className="ctaRow"><a className="button" href="/catalog">Explore cigars</a><a className="button secondary" href="/learn">Learn before choosing</a></div></div><div className="discoverImagePair"><figure><img src="/editorial/tobacco-field.jpg" alt="Broadleaf tobacco growing around a traditional curing shed"/><figcaption>From the field</figcaption></figure><figure><img src="/editorial/cigar-roller.jpg" alt="A cigar artisan working with tobacco leaves at a rolling table"/><figcaption>Through skilled hands</figcaption></figure></div></section>
  <section className="section"><div className="sectionHead"><div><div className="eyebrow">Begin with intention</div><h2>What are you hoping to accomplish?</h2></div></div><div className="discoverIntentions">{intentions.map(([title,body,href,action],index)=><a href={href} key={title}><span>0{index+1}</span><h3>{title}</h3><p>{body}</p><b>{action} →</b></a>)}</div></section>
  <section className="cultureEditorial"><div className="cultureEditorialImage"><img src="/editorial/tobacco-field.jpg" alt="A broadleaf tobacco field and curing shed in Connecticut"/></div><div><div className="eyebrow">Every cigar tells a story</div><h2>The collection is only the beginning.</h2><p>A complete cigar record should honor the seed and soil, the farmers who cultivate the leaf, the people who ferment and sort it, the blender’s intent, the roller’s skill, and the collectors who carry its story forward.</p><div className="cultureStoryLinks"><a href="/catalog"><span>Origin</span><strong>Regions, factories, and tobacco</strong></a><a href="/learn"><span>Craft</span><strong>Blending, construction, aging, and ritual</strong></a><a href="/community"><span>People</span><strong>Learn from collectors and industry voices</strong></a></div></div></section>
  <section className="trustFramework"><div><div className="eyebrow">The Cedriva Trust Framework</div><h2>Always know what you’re reading.</h2><p>Every meaningful claim should identify its source, date, confidence, and relationship to the collector.</p></div><div className="trustLevelList">{trustLevels.map(([level,name,body])=><article key={level}><span>{level}</span><div><strong>{name}</strong><small>{body}</small></div></article>)}</div></section>
  <section className="imageCredits"><span>Documentary photography</span><a href="https://unsplash.com/photos/23v1D4j8vO4" target="_blank" rel="noreferrer">Tobacco field by Rusty Watson ↗</a><a href="https://unsplash.com/photos/vHCkVUogO-w" target="_blank" rel="noreferrer">Cigar artisan by Austin ↗</a></section>
</main>}
