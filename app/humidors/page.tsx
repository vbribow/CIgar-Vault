import { HumidorManager } from "@/components/humidor-manager";
import { dataMode } from "@/lib/config";
import { loadInventory } from "@/lib/inventory";
import { getHumidorReadings,getHumidors } from "@/lib/smartsheet";
import "./humidors.css";
export const dynamic="force-dynamic";
export default async function HumidorsPage(){const mode=dataMode();const[inventory,humidors,readings]=await Promise.all([loadInventory(),mode==="mock"?[]:getHumidors(),mode==="mock"?[]:getHumidorReadings()]);return <main className="shell"><nav className="nav"><a className="brand" href="/">Cigar Vault</a><div className="navLinks"><a href="/storage">Storage</a><a href="/inventory">Inventory</a><span className="badge">Humidor control</span></div></nav><section className="humidorHero"><div><div className="eyebrow">Environmental storage</div><h1>Your vault, your climate.</h1><p className="lede">Choose the conditions for every humidor, record readings, and see immediately when a cigar’s environment needs attention.</p></div><div className="climateLegend"><strong>User-controlled targets</strong><span>Cigar Vault suggests starting values, but you decide the temperature and humidity ranges.</span></div></section><HumidorManager initialHumidors={humidors} initialReadings={readings} inventory={inventory} mode={mode}/></main>}
