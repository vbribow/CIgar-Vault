"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const stages = [
  { id:"curious",level:"01",name:"The Curious",statement:"I’m beginning to explore premium cigars.",promise:"Cedriva makes the culture approachable without simplifying what makes it special.",focus:["Learn the language","Choose with confidence","Enjoy the first experience"],primary:["/learn/foundations?journey=curious","Begin with the essentials"],secondary:["/discover?journey=curious#new-collector","Discover a welcoming first cigar"] },
  { id:"explorer",level:"02",name:"The Explorer",statement:"I’m learning what I enjoy.",promise:"Cedriva helps you recognize preferences, remember experiences, and discover what to try next.",focus:["Build a tasting vocabulary","Remember favorites","Explore makers and regions"],primary:["/records?journey=explorer#log-smoke","Remember a smoking experience"],secondary:["/discover?journey=explorer#explore-new","Explore something new"] },
  { id:"enthusiast",level:"03",name:"The Enthusiast",statement:"I’m building a collection with intention.",promise:"Cedriva connects collection care, aging, discovery, and education in one trusted home.",focus:["Care for a humidor","Follow releases","Build with purpose"],primary:["/inventory?journey=enthusiast#mobile-intake","Document my collection"],secondary:["/humidors?journey=enthusiast","Care for my humidors"] },
  { id:"collector",level:"04",name:"The Collector",statement:"My collection deserves serious stewardship.",promise:"Cedriva brings provenance, protection, market evidence, and advanced intelligence together.",focus:["Protect provenance","Understand value","Find meaningful gaps"],primary:["/intelligence?journey=collector","Understand my collection"],secondary:["/reports?journey=collector","Prepare a protection report"] },
  { id:"connoisseur",level:"05",name:"The Connoisseur",statement:"I want to share what I’ve learned.",promise:"Cedriva gives experienced collectors a respected place to teach, review, and preserve knowledge.",focus:["Contribute expertise","Mentor collectors","Preserve historical context"],primary:["/community?journey=connoisseur","Help another collector"],secondary:["/community?journey=connoisseur&tab=ratings","Contribute a cigar review"] },
  { id:"legacy",level:"06",name:"The Legacy Collector",statement:"My collection tells a story beyond me.",promise:"Cedriva helps preserve the meaning, provenance, and continuity of a lifetime of collecting.",focus:["Build a collection timeline","Protect provenance","Prepare a lasting record"],primary:["/legacy?journey=legacy#timeline","Shape my collection story"],secondary:["/legacy?journey=legacy#record","Protect its enduring record"] },
] as const;

type StageId = typeof stages[number]["id"];

export function CollectorJourney() {
  const [selected,setSelected]=useState<StageId>("explorer");
  useEffect(()=>{const saved=window.localStorage.getItem("cedriva-collector-stage") as StageId|null;if(saved&&stages.some(stage=>stage.id===saved))setSelected(saved)},[]);
  const stage=stages.find(item=>item.id===selected)!;
  function choose(id:StageId){setSelected(id);window.localStorage.setItem("cedriva-collector-stage",id)}
  return <section className="collectorJourney" aria-labelledby="collector-journey-heading">
    <div className="collectorJourneyIntro"><div><div className="eyebrow">Cedriva grows with you</div><h2 id="collector-journey-heading">Where are you in your collector journey?</h2></div><p>Choose the experience that feels closest today. Each path opens its own tailored starting point without limiting what you can explore.</p></div>
    <nav className="journeyStagePicker" aria-label="Choose a collector journey">{stages.map(item=><Link href={item.primary[0]} aria-current={item.id===selected?"step":undefined} className={item.id===selected?"active":undefined} onClick={()=>choose(item.id)} key={item.id}><span>{item.level}</span><strong>{item.name.replace("The ","")}</strong><small>Open path →</small></Link>)}</nav>
    <article className="journeyStagePanel" role="tabpanel"><div className="journeyStageCopy"><span>Level {stage.level}</span><h3>{stage.name}</h3><blockquote>“{stage.statement}”</blockquote><p>{stage.promise}</p></div><div className="journeyStageFocus"><span>What matters now</span>{stage.focus.map(item=><p key={item}><i>✓</i>{item}</p>)}</div><div className="journeyStageActions"><Link className="button" href={stage.primary[0]} prefetch>{stage.primary[1]} →</Link><Link className="textLink" href={stage.secondary[0]} prefetch>{stage.secondary[1]} →</Link></div></article>
  </section>;
}
