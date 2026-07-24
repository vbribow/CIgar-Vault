import type { Metadata } from "next";
import { loadCatalog } from "@/lib/catalog";
import { loadInventory } from "@/lib/inventory";
import { cigarProductKey } from "@/lib/cigar-identity";
export const metadata:Metadata={title:"Discover",description:"Discover premium cigars through stories, trusted knowledge, collector goals, and the people and places behind the craft."};
const intentions=[
  ["I’m new to premium cigars","Learn the essentials without judgment, then find a comfortable place to begin.","/learn/foundations","Begin with confidence"],
  ["I want to try something new","See documented cigars beyond your current vault, then ask Cigar Somm to explain the experience and pairings.","#beyond-vault","Show me something different"],
  ["I’m building with purpose","Connect discovery to collection goals, aging plans, wish lists, and what you already enjoy.","/wishlist","Shape my wish list"],
] as const;
const trustLevels=[
  ["01","Official","Verified information supplied directly by a manufacturer."],
  ["02","Verified Historical","Information confirmed through multiple trusted sources."],
  ["03","Expert","Knowledge contributed by a verified expert or independent publication."],
  ["04","Community","Collector reviews, tasting notes, questions, and lived experience."],
  ["05","AI","Clearly identified guidance generated from trusted Cedriva knowledge."],
] as const;
const advisorHref=(name:string)=>`/cigar-somm?${new URLSearchParams({cigarName:name,question:"Help me decide whether to try this cigar. Explain its likely profile, strength, what makes it distinct, and suitable coffee, spirit, cocktail, and nonalcoholic pairings. Be candid about uncertainty."})}`;
export default async function DiscoverPage(){
  const inventory=await loadInventory();
  const catalog=await loadCatalog(inventory);
  const ownedProducts=new Set(inventory.map(cigarProductKey));
  const ownedBrands=new Set(inventory.map(item=>item.brand.trim().toLowerCase()));
  const candidates=catalog
    .filter(item=>!ownedProducts.has(cigarProductKey(item)))
    .sort((a,b)=>Number(ownedBrands.has(a.brand.toLowerCase()))-Number(ownedBrands.has(b.brand.toLowerCase()))||Number(Boolean(b.sourceUrl))-Number(Boolean(a.sourceUrl))||a.brand.localeCompare(b.brand))
    .filter((item,index,all)=>all.findIndex(candidate=>candidate.brand.toLowerCase()===item.brand.toLowerCase())===index)
    .slice(0,6);
  return <main className="shell discoverPage">
  <section className="discoverHero"><div><div className="eyebrow">Cedriva Discover</div><h1>Find the next meaningful cigar.</h1><p className="lede">Start with who you are, what you want to experience, or what you hope to learn. Cedriva connects every recommendation to story, context, and visible sources—not an advertising feed.</p><div className="ctaRow"><a className="button" href="/catalog">Explore cigars</a><a className="button secondary" href="/learn">Learn before choosing</a></div></div><div className="discoverImagePair"><figure><img src="/editorial/tobacco-field.jpg" alt="Broadleaf tobacco growing around a traditional curing shed"/><figcaption>From the field</figcaption></figure><figure><img src="/editorial/cigar-roller.jpg" alt="A cigar artisan working with tobacco leaves at a rolling table"/><figcaption>Through skilled hands</figcaption></figure></div></section>
  <section className="section"><div className="sectionHead"><div><div className="eyebrow">Begin with intention</div><h2>What are you hoping to accomplish?</h2></div></div><div className="discoverIntentions">{intentions.map(([title,body,href,action],index)=><a href={href} id={index===0?"new-collector":index===1?"explore-new":undefined} key={title}><span>0{index+1}</span><h3>{title}</h3><p>{body}</p><b>{action} →</b></a>)}</div></section>
  <section className="section discoverShortlist" id="beyond-vault"><div className="sectionHead"><div><div className="eyebrow">Beyond your vault</div><h2>Documented cigars you do not already own</h2><p className="small">A starting point—not a paid placement or an assertion that one cigar is objectively better. Cedriva favors a different maker first, preserves source visibility, and lets Cigar Somm explain each choice.</p></div><a className="textLink" href="/catalog">Open the complete reference →</a></div>
    {candidates.length?<div className="discoveryCandidates">{candidates.map(item=>{const name=`${item.brand} ${item.line} ${item.vitola}`;return <article key={item.catalogId}><span>{item.country||"Origin under review"}</span><h3>{item.brand}</h3><strong>{item.line}</strong><p>{item.vitola}</p><div><a className="button" href={advisorHref(name)}>Ask Cigar Somm</a>{item.sourceUrl&&<a className="textLink" href={item.sourceUrl} target="_blank" rel="noreferrer">Review source ↗</a>}</div></article>})}</div>:<div className="emptyState">Cedriva needs more documented catalog records before it can recommend a cigar beyond your current vault.</div>}
  </section>
  <section className="cultureEditorial"><div className="cultureEditorialImage"><img src="/editorial/tobacco-field.jpg" alt="A broadleaf tobacco field and curing shed in Connecticut"/></div><div><div className="eyebrow">Every cigar tells a story</div><h2>The collection is only the beginning.</h2><p>A complete cigar record should honor the seed and soil, the farmers who cultivate the leaf, the people who ferment and sort it, the blender’s intent, the roller’s skill, and the collectors who carry its story forward.</p><div className="cultureStoryLinks"><a href="/catalog"><span>Origin</span><strong>Regions, factories, and tobacco</strong></a><a href="/learn"><span>Craft</span><strong>Blending, construction, aging, and ritual</strong></a><a href="/community"><span>People</span><strong>Learn from collectors and industry voices</strong></a></div></div></section>
  <section className="trustFramework"><div><div className="eyebrow">The Cedriva Trust Framework</div><h2>Always know what you’re reading.</h2><p>Every meaningful claim should identify its source, date, confidence, and relationship to the collector.</p></div><div className="trustLevelList">{trustLevels.map(([level,name,body])=><article key={level}><span>{level}</span><div><strong>{name}</strong><small>{body}</small></div></article>)}</div></section>
  <section className="imageCredits"><span>Documentary photography</span><a href="https://unsplash.com/photos/23v1D4j8vO4" target="_blank" rel="noreferrer">Tobacco field by Rusty Watson ↗</a><a href="https://unsplash.com/photos/vHCkVUogO-w" target="_blank" rel="noreferrer">Cigar artisan by Austin ↗</a></section>
</main>}
