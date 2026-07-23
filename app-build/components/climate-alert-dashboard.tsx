"use client";
import { useMemo,useState } from "react";
import { climateHealth,historicalClimateAlerts } from "@/lib/climate-alerts";
import type { EnvironmentalSensor,Humidor,HumidorReading,InventoryItem } from "@/lib/types";

const windows={"24H":24,"7D":24*7,"30D":24*30} as const;
const dollars=(value:number)=>value.toLocaleString(undefined,{style:"currency",currency:"USD",maximumFractionDigits:0});
const statusClass=(value:string)=>value.toLowerCase();

export function ClimateAlertDashboard({humidors,readings,sensors,inventory,nowISO}:{humidors:Humidor[];readings:HumidorReading[];sensors:EnvironmentalSensor[];inventory:InventoryItem[];nowISO:string}){
  const[windowKey,setWindowKey]=useState<keyof typeof windows>("7D");
  const now=useMemo(()=>new Date(nowISO),[nowISO]);
  const health=useMemo(()=>humidors.map(h=>climateHealth(h,readings,sensors,inventory,now)),[humidors,readings,sensors,inventory,now]);
  const cutoff=now.getTime()-windows[windowKey]*3_600_000;
  const windowReadings=readings.filter(r=>new Date(r.recordedAt).getTime()>=cutoff);
  const history=historicalClimateAlerts(humidors,windowReadings);
  const activeAlerts=health.flatMap(h=>h.alerts);
  const exposed=health.reduce((sum,h)=>sum+h.valueAtRisk,0);
  const unmonitored=health.reduce((sum,h)=>sum+h.unmonitoredValue,0);
  return <section className="climateCommand" aria-labelledby="climate-command-title">
    <div className="commandHead"><div><div className="eyebrow">Climate command center</div><h2 id="climate-command-title">Protect the collection.</h2><p>Live environmental status, sensor health, and financial exposure in one view.</p></div><div className="windowPicker" aria-label="Climate history range">{Object.keys(windows).map(key=><button className={key===windowKey?"active":""} onClick={()=>setWindowKey(key as keyof typeof windows)} key={key}>{key}</button>)}</div></div>
    <div className="commandMetrics"><article><span>Protected</span><strong>{health.filter(h=>h.severity==="Good").length} / {humidors.length}</strong><small>Humidors reporting in range</small></article><article className={activeAlerts.length?"metricWarning":""}><span>Active alerts</span><strong>{activeAlerts.length}</strong><small>{activeAlerts.filter(a=>a.severity==="Critical").length} critical</small></article><article className={exposed?"metricDanger":""}><span>Value at risk</span><strong>{dollars(exposed)}</strong><small>In out-of-range environments</small></article><article className={unmonitored?"metricWarning":""}><span>Unmonitored value</span><strong>{dollars(unmonitored)}</strong><small>Behind offline or missing readings</small></article></div>
    <div className="commandGrid"><div className="healthStack">{health.map(item=>{const chart=item.rows.filter(r=>new Date(r.recordedAt).getTime()>=cutoff).reverse().slice(-40);return <article className={`healthRow ${statusClass(item.severity)}`} key={item.humidor.humidorId}><div className="healthIdentity"><span className={`healthBadge ${statusClass(item.severity)}`}>{item.severity}</span><div><h3>{item.humidor.name}</h3><small>{item.sensor?`${item.sensor.provider} · ${item.sensor.name}`:"No registered sensor"}</small></div></div><div className="healthNow"><span><small>Temperature</small><strong>{item.latest?`${item.latest.temperatureF}°F`:"—"}</strong></span><span><small>Humidity</small><strong>{item.latest?`${item.latest.humidity}%`:"—"}</strong></span><span><small>Battery</small><strong>{item.battery===undefined?"—":`${item.battery}%`}</strong></span><span><small>Stored value</small><strong>{dollars(item.storedValue)}</strong></span></div><div className="miniTrend" aria-label={`${item.humidor.name} readings for ${windowKey}`}>{chart.length?chart.map(r=><i key={r.readingId} className={r.temperatureF<item.humidor.minTempF||r.temperatureF>item.humidor.maxTempF||r.humidity<item.humidor.minHumidity||r.humidity>item.humidor.maxHumidity?"excursion":""} style={{height:`${Math.max(18,Math.min(100,(r.humidity-30)/60*100))}%`}} title={`${r.recordedAt}: ${r.temperatureF}°F · ${r.humidity}%`}/>):<em>No readings in this period</em>}</div><div className="healthActions"><span>{item.alerts[0]?.message||(item.latest?`Last reading ${item.latest.recordedAt.replace("T"," ")}`:"Register or import a sensor reading")}</span><a href={`/humidors/${encodeURIComponent(item.humidor.humidorId)}`}>View climate details →</a></div></article>})}{!health.length&&<div className="emptyState">Add a humidor to begin climate monitoring.</div>}</div>
      <aside className="alertLedger"><div className="ledgerTitle"><div><div className="eyebrow">Alert history</div><h3>{windowKey} exceptions</h3></div><strong>{history.length}</strong></div>{history.map(alert=><div className="ledgerEvent" key={alert.id}><i className={statusClass(alert.severity)}/><div><strong>{humidors.find(h=>h.humidorId===alert.humidorId)?.name||alert.humidorId}</strong><span>{alert.message}</span><small>{alert.recordedAt?.replace("T"," ")}</small></div></div>)}{!history.length&&<p className="stableMessage">No out-of-range readings in this period.</p>}<div className="notificationRoadmap"><strong>Notification readiness</strong><span>Dashboard alerts available now</span><span>Email and text delivery next</span></div></aside>
    </div>
  </section>
}
