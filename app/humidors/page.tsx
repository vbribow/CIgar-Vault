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
          <strong>User-controlled targets</strong>
          <span>
            Cigar Vault suggests starting values, but you decide the temperature
            and humidity ranges.
          </span>
        </div>
      </section>
      <WorkspaceGuide items={[{label:"Set",title:"Choose climate targets",detail:"Temperature and humidity ranges remain under collector control."},{label:"Connect",title:"Add readings or sensors",detail:"Use manual records, Tempi history, or configured cloud connections.",href:"/sensors"},{label:"Protect",title:"Act on value at risk",detail:"Alerts connect environmental exceptions to the inventory stored inside."}]}/>
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
