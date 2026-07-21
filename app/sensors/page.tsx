import { SensorManager } from "@/components/sensor-manager";
import { SensorSyncPanel } from "@/components/sensor-sync-panel";
import { dataMode } from "@/lib/config";
import { getHumidors,getSensors } from "@/lib/smartsheet";
import "./sensors.css";
export const dynamic="force-dynamic";

const providers = [
  {
    name: "Tempi",
    monogram: "T",
    status: "CSV ready now",
    description: "Bluetooth monitoring with minute-by-minute history and direct CSV export from the Tempi app.",
    href: "https://tempi.fi/",
    action: "Visit Tempi",
    featured: true,
  },
  {
    name: "SensorPush",
    monogram: "SP",
    status: "Cloud API next",
    description: "Compact humidor sensors with Bluetooth, optional Wi-Fi gateway, remote alerts, and a documented cloud API.",
    href: "https://www.sensorpush.com/",
    action: "Visit SensorPush",
  },
  {
    name: "Govee",
    monogram: "G",
    status: "Integration planned",
    description: "Bluetooth and Wi-Fi thermo-hygrometers with app alerts, historical readings, and data export options.",
    href: "https://us.govee.com/collections/smart-thermo-hygrometers",
    action: "Visit Govee",
  },
];

export default async function SensorsPage(){
  const mode=dataMode();
  const[humidors,sensors]=mode==="mock"?[[],[]]:await Promise.all([getHumidors(),getSensors()]);
  const sensorPushConfigured=Boolean(process.env.SENSORPUSH_EMAIL&&process.env.SENSORPUSH_PASSWORD);
  const linkedSensorPush=sensors.filter(sensor=>sensor.provider.toLowerCase()==="sensorpush"&&sensor.externalDeviceId).length;
  return <main className="shell">
    <section className="sensorHero"><div><div className="eyebrow">Connected climate</div><h1>Sensors, normalized.</h1><p className="lede">Register Tempi now and preserve one clean reading format for every future Bluetooth, gateway, and cloud provider.</p></div><div className="tempiCallout"><strong>Tempi-ready</strong><span>Import exported CSV history today. Gateway or mobile-bridge sync can use the same ingestion path later.</span><a href="https://tempi.fi/support/" target="_blank" rel="noreferrer">Tempi export instructions ↗</a></div></section>
    <section className="providerSection" aria-labelledby="provider-heading">
      <div className="providerHeading"><div><div className="eyebrow">Compatible ecosystem</div><h2 id="provider-heading">Start with a trusted sensor.</h2></div><p>Cigar Vault stores every provider in one standard climate record, so changing hardware will not strand your history.</p></div>
      <div className="providerGrid">{providers.map(provider=><article className={`providerCard ${provider.featured?"featured":""}`} key={provider.name}><div className="providerMark" aria-hidden="true">{provider.monogram}</div><div className="providerStatus">{provider.status}</div><h3>{provider.name}</h3><p>{provider.description}</p><a href={provider.href} target="_blank" rel="noreferrer">{provider.action} ↗</a></article>)}</div>
    </section>
    <SensorSyncPanel configured={sensorPushConfigured} linkedSensors={linkedSensorPush} scheduleReady={Boolean(process.env.CRON_SECRET)}/>
    <SensorManager initialSensors={sensors} humidors={humidors} mode={mode}/>
  </main>
}
