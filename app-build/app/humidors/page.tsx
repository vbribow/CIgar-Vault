import { HumidorManager } from "@/components/humidor-manager";
import { ClimateAlertDashboard } from "@/components/climate-alert-dashboard";
import { accountDataMode } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadHumidorReadings, loadHumidors, loadSensors } from "@/lib/data";
import "./humidors.css";
import "./quick-links.css";
import { WorkspaceGuide } from "@/components/workspace-guide";
export const dynamic = "force-dynamic";
export default async function HumidorsPage() {
  const mode = await accountDataMode();
  const [inventory, humidors, readings, sensors] = await Promise.all([
    loadInventory(),
    mode === "mock" ? [] : loadHumidors(),
    mode === "mock" ? [] : loadHumidorReadings(),
    mode === "mock" ? [] : loadSensors(),
  ]);
  return (
    <main className="shell">
      <section className="humidorHero">
        <div>
          <div className="eyebrow">Environmental storage</div>
          <h1>Your vault, your climate.</h1>
          <p className="lede">
            Choose the conditions for every humidor, record readings, and see
            immediately when a cigar’s environment needs attention.
          </p>
        </div>
        <div className="climateLegend">
          <strong>Start with evidence. Adjust with experience.</strong>
          <span>
            Most New World cigars: 65–70°F and 65–69% RH. Official Habanos
            guidance: 61–64°F and 65–70% RH.
          </span>
          <a className="textLink" href="/learn/humidor-climate">Understand temperature, humidity, and time →</a>
        </div>
      </section>
      <WorkspaceGuide items={[{label:"Set",title:"Choose climate targets",detail:"Temperature and humidity ranges remain under collector control."},{label:"Connect",title:"Add readings or sensors",detail:"Use manual records, Tempi history, or configured cloud connections.",href:"/sensors"},{label:"Protect",title:"Act on value at risk",detail:"Alerts connect environmental exceptions to the inventory stored inside."}]}/>
      <section className="humidorEducation">
        <div><div className="eyebrow">Climate education in context</div><h2>Protect the trend—not a folklore number.</h2><p>A brief door-opening spike is different from a month of heat. Learn how temperature and relative humidity interact, what New World cigars and Habanos call for, and how to correct a problem without shocking the tobacco.</p></div>
        <div><span><b>New World start</b><strong>65–70°F · 65–69% RH</strong></span><span><b>Official Habanos</b><strong>61–64°F · 65–70% RH</strong></span><a className="button secondary" href="/learn/humidor-climate">Open the complete climate lesson</a></div>
      </section>
      <ClimateAlertDashboard
        humidors={humidors}
        readings={readings}
        sensors={sensors}
        inventory={inventory}
        nowISO={new Date().toISOString()}
      />
      {humidors.length > 0 && (
        <section className="climateDetailLinks">
          <span>Climate intelligence</span>
          {humidors.map((h) => (
            <a
              href={`/humidors/${encodeURIComponent(h.humidorId)}`}
              key={h.humidorId}
            >
              {h.name}
              <b>View trends →</b>
            </a>
          ))}
        </section>
      )}
      <HumidorManager
        initialHumidors={humidors}
        initialReadings={readings}
        inventory={inventory}
        mode={mode}
      />
    </main>
  );
}
