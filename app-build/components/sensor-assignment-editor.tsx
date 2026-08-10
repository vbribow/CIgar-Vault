"use client";

import { FormEvent, useMemo, useState } from "react";
import type { EnvironmentalSensor, Humidor } from "@/lib/types";

export function SensorAssignmentEditor({
  sensors,
  humidors,
}: {
  sensors: EnvironmentalSensor[];
  humidors: Humidor[];
}) {
  const [sensorId, setSensorId] = useState(sensors[0]?.sensorId || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const sensor = useMemo(
    () => sensors.find((value) => value.sensorId === sensorId),
    [sensorId, sensors],
  );

  if (!sensor) return null;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !sensor) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/sensors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sensor,
          name: String(data.get("name") || ""),
          externalDeviceId: String(data.get("externalDeviceId") || "") || undefined,
          humidorId: String(data.get("humidorId") || ""),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Sensor update failed");
      setMessage(
        `${result.data.name} was updated. ${Number(result.reassignedReadings || 0).toLocaleString()} existing readings followed the sensor.`,
      );
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sensor update failed");
      setBusy(false);
    }
  }

  return (
    <section className="sensorForms sensorCorrection">
      <article className="card">
        <div className="eyebrow">Sensor correction</div>
        <h2>Edit a registered sensor</h2>
        <p className="small">
          Correct its exported name, serial number, or humidor. Existing readings
          follow the sensor atomically and are never deleted.
        </p>
        <form className="recordForm" onSubmit={save} aria-busy={busy}>
          <label>
            <span>Registered sensor</span>
            <select value={sensorId} onChange={(event) => setSensorId(event.target.value)}>
              {sensors.map((value) => (
                <option value={value.sensorId} key={value.sensorId}>
                  {value.name} · {value.provider}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Sensor name</span>
            <input name="name" required key={`name-${sensor.sensorId}`} defaultValue={sensor.name} />
          </label>
          <label>
            <span>Tempi serial number</span>
            <input
              name="externalDeviceId"
              key={`serial-${sensor.sensorId}`}
              defaultValue={sensor.externalDeviceId}
            />
          </label>
          <label>
            <span>Humidor</span>
            <select name="humidorId" required key={`humidor-${sensor.sensorId}`} defaultValue={sensor.humidorId}>
              {humidors.map((humidor) => (
                <option value={humidor.humidorId} key={humidor.humidorId}>
                  {humidor.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button" disabled={busy}>
            {busy ? "Updating…" : "Update sensor"}
          </button>
        </form>
        {message && <output className="wideMessage">{message}</output>}
      </article>
    </section>
  );
}
