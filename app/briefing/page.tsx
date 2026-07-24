import type { Metadata } from "next";
import { loadInventory } from "@/lib/inventory";
import { loadHumidorReadings,loadHumidors,loadSensors,loadSmokingLogs,loadValuations } from "@/lib/data";
import { buildCollectionIntelligence } from "@/lib/collection-intelligence";
import { loadPublicIndustry } from "@/lib/industry-public";
import { buildDailyBriefing } from "@/lib/daily-briefing";
import "./briefing.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Cedriva Daily Briefing",description:"Proactive, evidence-aware collection and industry intelligence personalized to the collector."};

export default async function BriefingPage(){
  const[inventory,valuations,humidors,readings,sensors,smokes,industry]=await Promise.all([loadInventory(),loadValuations(),loadHumidors(),loadHumidorReadings(),loadSensors(),loadSmokingLogs(),loadPublicIndustry()]);
  const intelligence=buildCollectionIntelligence({inventory,valuations,humidors,readings,sensors,smokes});const briefing=buildDailyBriefing({inventory,humidors,readings,sensors,intelligence,registry:industry.registryRecords});
  return <main className="shell wideShell briefingPage"><section className="briefingHero"><div><div className="eyebrow">Cedriva Daily Briefing · Private</div><h1>What deserves your attention today.</h1><p className="lede">Climate, collection evidence, smoking windows, market movement, and official industry releases—ranked without manufacturing urgency.</p></div><aside><span>Generated</span><strong>{new Date(briefing.generatedAt).toLocaleDateString()}</strong><small>{new Date(briefing.generatedAt).toLocaleTimeString()}</small></aside></section>
    <section className="briefingSummary"><article><strong>{briefing.summary.urgent}</strong><span>urgent conditions</span></article><article><strong>{briefing.summary.collector}</strong><span>private collection signals</span></article><article><strong>{briefing.summary.industry}</strong><span>official industry updates</span></article><article><strong>{briefing.items.length}</strong><span>prioritized brief items</span></article></section>
    <section className="briefingLedger">{briefing.items.map((item,index)=><a href={item.href} key={item.id} data-priority={item.priority}><span className="briefingNumber">{String(index+1).padStart(2,"0")}</span><div><small>{item.priority} · {item.source}</small><h2>{item.title}</h2><p>{item.detail}</p><em>{item.reason}</em></div><b>Open →</b></a>)}</section>
    <section className="briefingStandard"><div><div className="eyebrow">Intelligence standard</div><h2>Proactive does not mean presumptuous.</h2></div><ul><li>Climate warnings use sensor evidence and configured storage ranges.</li><li>Market movement requires at least two dated valuations.</li><li>Smoking windows are labeled AI-assisted and expose their limitations.</li><li>Official releases identify the organization as the source.</li><li>Cedriva withholds a recommendation when the evidence is insufficient.</li></ul></section>
  </main>;
}
