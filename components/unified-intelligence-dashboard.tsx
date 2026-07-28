import type { buildDailyBriefing } from "@/lib/daily-briefing";
import type { buildCollectionGoals } from "@/lib/decision-support";
import type { buildCollectionIntelligence } from "@/lib/collection-intelligence";
import { brand } from "@/lib/brand";

const money=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});

export function UnifiedIntelligenceDashboard({intelligence,briefing,goals}:{intelligence:ReturnType<typeof buildCollectionIntelligence>;briefing:ReturnType<typeof buildDailyBriefing>;goals:ReturnType<typeof buildCollectionGoals>}){
  const mover=intelligence.history.movers[0],smoke=intelligence.advisor.smokeNow[0],goal=goals.find(item=>item.remaining>0),risk=briefing.items.find(item=>item.priority==="Now"||item.source==="Climate evidence");
  const questions=[
    {question:"What is my collection worth?",answer:money.format(intelligence.totals.value),detail:`${intelligence.history.totals.coverage}% of lots have dated value evidence.`,href:"/valuations",label:"Understand the value"},
    {question:"What changed?",answer:mover?`${mover.changePercent>0?"+":""}${mover.changePercent}%`:"History is building",detail:mover?`${mover.item.brand} ${mover.item.line} has the largest measured lot movement.`:`${brand.name} requires two dated valuations before reporting movement.`,href:"/value-history",label:"Review dated movement"},
    {question:"What should I smoke?",answer:smoke?`${smoke.brand} ${smoke.line}`:"More evidence needed",detail:smoke?`${smoke.vitola} · ${smoke.vintage||"year unknown"} · AI-assisted smoking-window candidate.`:"Add release years and tasting evidence to unlock guidance.",href:smoke?"/cigar-somm":"/inventory#inventory-records",label:smoke?"Consult Cigar Somm":"Complete missing facts"},
    {question:"What should I buy?",answer:goal?goal.nextAction:"Buy with a purpose",detail:goal?`${goal.collection.name} is ${goal.progress}% complete.`:"Define a collection goal or evaluate a candidate against your tastes, holdings, and evidence.",href:"/decision-center",label:"Open decision center"},
    {question:"What needs attention?",answer:risk?risk.title:"No urgent condition",detail:risk?risk.detail:`${intelligence.advisor.needsAttention.length} collection records currently lead the evidence queue.`,href:risk?.href||"/inventory-integrity",label:"Protect the collection"},
  ];
  return <section className="fiveQuestionDashboard"><div className="sectionHead"><div><div className="eyebrow">Unified Collector Intelligence</div><h2>Five questions. One evidence-aware view.</h2><p className="small">The collector remains the decision-maker. {brand.name} connects the evidence and explains its limitations.</p></div><a className="button" href="/briefing">Read today’s briefing</a></div><div>{questions.map((item,index)=><a href={item.href} key={item.question}><span>{String(index+1).padStart(2,"0")}</span><small>{item.question}</small><h3>{item.answer}</h3><p>{item.detail}</p><strong>{item.label} →</strong></a>)}</div></section>;
}
