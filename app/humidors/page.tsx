import { HumidorManager } from "@/components/humidor-manager";
import { ClimateAlertDashboard } from "@/components/climate-alert-dashboard";
import { dataMode } from "@/lib/config";
import { loadInventory } from "@/lib/inventory";
import { getHumidorReadings,getHumidors,getSensors } from "@/lib/smartsheet";
import "./humidors.css";
import "./quick-links.css";
export const dynamic="force-dynamic";
export default async function HumidorsPage(){const mode=dataMode();const[inventory,humidors,readings,sensors]=await Promise.all([loadInventory(),mode==="mock"?[]:getHumidors(),mode==="mock"?[]:getHumidorReadings(),mode==="mock"?[]:getSensors()]);return <main className="shell"><section className="humidorHero"><div><div className="eyebrow">Environmental storage</div><h1>Your vault, your climate.</h1><p className="lede">Choose the conditions for every humidor, record readings, and see immediately when a cigar’s environment needs attention.</p></div><div className="climateLegend"><strong>User-controlled targets</strong><span>Cigar Vault suggests starting values, but you decide the temperature and humidity ranges.</span></div></section><ClimateAlertDashboard humidors={humidors} readings={readings} sensors={sensors} inventory={inventory} nowISO={new Date().toISOString()}/>{humidors.length>0&&<section className="climateDetailLinks"><span>Climate intelligence</span>{humidors.map(h=><a href={`/humidors/${encodeURIComponent(h.humidorId)}`} key={h.humidorId}>{h.name}<b>View trends →</b></a>)}</section>}<HumidorManager initialHumidors={humidors} initialReadings={readings} inventory={inventory} mode={mode}/></main>}
