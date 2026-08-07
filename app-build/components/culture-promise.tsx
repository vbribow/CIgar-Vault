import { brand } from "@/lib/brand";

const chapters = [
  { number:"01", label:"Leaf", title:"Begin with agriculture.", body:"Follow seed, soil, harvest, curing, and fermentation before the cigar ever reaches a rolling table.", href:"/learn/seed-to-smoke", action:"Follow the leaf" },
  { number:"02", label:"Craft", title:"Credit the hands and knowledge.", body:"Connect makers, blenders, rollers, factories, regions, and documented production relationships.", href:"/learn/manufacturing-truth", action:"Meet the craft" },
  { number:"03", label:"Culture", title:"Keep makers and collectors in conversation.", body:"Connect growers, makers, retailers, lounges, writers, and collectors while keeping fact, experience, and attribution distinct.", href:"/community", action:"Enter the culture" },
  { number:"04", label:"Legacy", title:"Preserve why it mattered.", body:"Record the people, occasions, journeys, and cigars shared so a collection carries more than names, quantities, and prices.", href:"/legacy", action:"Shape the record" },
] as const;

export function CulturePromise() {
  return <section className="culturePromise" aria-labelledby="culture-promise-heading">
    <header><div><div className="eyebrow">{brand.journeyLine}</div><h2 id="culture-promise-heading">A collection belongs to a living culture.</h2></div><p>{brand.name} connects the cigar you preserve to the agriculture, craft, people, and memories that give it meaning—and helps that knowledge travel without losing sight of its source.</p></header>
    <div className="culturePromiseGrid">{chapters.map(chapter=><a href={chapter.href} key={chapter.number}><span>{chapter.number} · {chapter.label}</span><h3>{chapter.title}</h3><p>{chapter.body}</p><strong>{chapter.action} →</strong></a>)}</div>
  </section>;
}
