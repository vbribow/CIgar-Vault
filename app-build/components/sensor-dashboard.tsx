import type { EnvironmentalSensor,Humidor,HumidorReading } from "@/lib/types";
import { automaticSensorReadingIsStale } from "@/lib/sensor-model";
import { sensorFleetSnapshot } from "@/lib/system-health";
import { LocalDateTime } from "@/components/local-date-time";

export function SensorDashboard({sensors,humidors,readings}:{sensors:EnvironmentalSensor[];humidors:Humidor[];readings:HumidorReading[]}){
  const activeCloudSensors=sensors.filter(sensor=>sensor.provider.toLowerCase()==="sensorpush"&&sensor.syncMethod==="Cloud API"&&sensor.externalDeviceId);
  const dashboardSensors=activeCloudSensors.length?activeCloudSensors:sensors;
  const latest=new Map<string,HumidorReading>();
  for(const reading of readings){
    if(!reading.sensorId)continue;
    const current=latest.get(reading.sensorId);
    if(!current||reading.recordedAt>current.recordedAt)latest.set(reading.sensorId,reading);
  }
  const state=(sensor:EnvironmentalSensor)=>{
    const reading=latest.get(sensor.sensorId),humidor=humidors.find(item=>item.humidorId===sensor.humidorId);
    if(sensor.connectionStatus==="Error")return"Error";
    if(automaticSensorReadingIsStale(sensor,reading?.recordedAt))return"Stale";
    if(!reading)return sensor.connectionStatus;
    return humidor&&(reading.temperatureF<humidor.minTempF||reading.temperatureF>humidor.maxTempF||reading.humidity<humidor.minHumidity||reading.humidity>humidor.maxHumidity)?"Attention":"Stable";
  };
  const statusDetail=(sensorState:string)=>sensorState==="Stale"?"This device is delayed; the other sensors continue updating independently.":sensorState==="Error"?"This device needs attention; its saved history remains available.":"Waiting for this device’s first reading.";
  const fleet=sensorFleetSnapshot(dashboardSensors,readings);
  const dashboardTitle=humidors.length===1?`${humidors[0].name} dashboard`:"Every active sensor at a glance";
  return <section className="sensorDashboard" aria-labelledby="sensor-dashboard-title">
    <div className="sensorDashboardHead"><div><div className="eyebrow">Live humidor dashboard</div><h2 id="sensor-dashboard-title">{dashboardTitle}</h2></div><p>Current temperature, humidity, status, and last update appear together. Historical CSV devices remain preserved in the registry below without competing with the live fleet.</p></div>
    {fleet.total>0&&<div className={`sensorFleetSummary ${fleet.status.toLowerCase()}`} role="status"><strong>{fleet.current} of {fleet.total} SensorPush devices current</strong><span>{fleet.latestReadingAt?<>Newest reading <LocalDateTime value={fleet.latestReadingAt}/></>:"No cloud reading received"}</span><small>{fleet.stale?`${fleet.stale} device${fleet.stale===1?" is":"s are"} delayed. Current devices continue reporting while hourly synchronization catches up the others.`:"Hourly synchronization is current across the connected fleet."}</small></div>}
    <div className="sensorGrid">{dashboardSensors.map(sensor=>{
      const reading=latest.get(sensor.sensorId),humidor=humidors.find(item=>item.humidorId===sensor.humidorId),sensorState=state(sensor);
      return <article className={`sensorCard ${["Attention","Stale","Error"].includes(sensorState)?"alert":""}`} key={sensor.sensorId}><div className="sensorStatus"><i className={sensorState.toLowerCase().replace(" ","-")}/><span>{sensorState}</span></div><div className="eyebrow">{sensor.provider} · {sensor.model||"Model not set"}</div><h3>{sensor.name}</h3><p>{humidor?.name||sensor.humidorId}</p><div className="sensorReadingNow"><span><small>Temperature</small><strong>{reading?`${reading.temperatureF.toFixed(1)}°F`:"—"}</strong></span><span><small>Humidity</small><strong>{reading?`${reading.humidity.toFixed(1)}%`:"—"}</strong></span></div><div className="sensorCardMeta"><span>{sensor.syncMethod}</span><span>{reading?.batteryPercent===undefined&&sensor.batteryPercent===undefined?"Battery —":`Battery ${reading?.batteryPercent??sensor.batteryPercent}%`}</span></div><small>{reading&&!["Stale","Error"].includes(sensorState)?<>Last successful reading <LocalDateTime value={reading.recordedAt}/></>:statusDetail(sensorState)}</small></article>
    })}{!dashboardSensors.length&&<div className="emptyState"><strong>No connected sensors are assigned yet.</strong><p>Open Connected Climate to register a sensor and assign it to this humidor.</p><a className="button secondary" href="/sensors">Open Connected Climate</a></div>}</div>
  </section>;
}
