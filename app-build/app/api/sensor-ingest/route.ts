import { NextResponse } from "next/server";
import { authorizeWrite } from "@/lib/config";
import { loadHumidorReadings, loadSensors } from "@/lib/data";
import { SensorIngestSchema, uniqueSensorReadings } from "@/lib/sensor-model";
import { getSensors, ingestSensorReadings, saveSensor } from "@/lib/smartsheet";
import { processClimateAlertNotifications } from "@/lib/alert-notifications";
import { accountDataMode, saveOwnedRecordsAtomically } from "@/lib/user-data";
import type { HumidorReading } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { readings } = SensorIngestSchema.parse(await request.json());

    if (await accountDataMode() === "supabase") {
      const [sensors, existingReadings] = await Promise.all([
        loadSensors(),
        loadHumidorReadings(),
      ]);
      const known = new Set(sensors.map((sensor) => sensor.sensorId));
      if (readings.some((reading) => !known.has(reading.sensorId))) {
        return NextResponse.json(
          { error: "Register the sensor before importing readings" },
          { status: 422 },
        );
      }

      const existingIds = existingReadings.flatMap((reading) =>
        reading.externalReadingId ? [reading.externalReadingId] : [],
      );
      const { unique, duplicates } = uniqueSensorReadings(readings, existingIds);
      const importedAt = new Date().toISOString();
      const imported: HumidorReading[] = unique.map((reading) => ({
        ...reading,
        readingId: `READ-${crypto.randomUUID()}`,
        source: reading.source || `${reading.provider} import`,
        importedAt,
      }));
      const synced = new Set(readings.map((reading) => reading.sensorId));
      const updatedSensors = sensors
        .filter((sensor) => synced.has(sensor.sensorId))
        .map((sensor) => ({
          ...sensor,
          lastSyncAt: importedAt,
          connectionStatus: "Connected" as const,
        }));
      const saved = await saveOwnedRecordsAtomically([
        ...imported.map((reading) => ({
          kind: "readings" as const,
          recordId: reading.readingId,
          payload: reading,
        })),
        ...updatedSensors.map((sensor) => ({
          kind: "sensors" as const,
          recordId: sensor.sensorId,
          payload: sensor,
        })),
      ]);
      if (!saved) {
        return NextResponse.json(
          { error: "Sign in before importing private climate readings" },
          { status: 401 },
        );
      }
      return NextResponse.json(
        {
          data: {
            imported: imported.length,
            duplicates,
            notifications: { enabled: false, sent: 0, skipped: 0, retried: 0 },
          },
        },
        { status: 201 },
      );
    }

    if (!authorizeWrite(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sensors = await getSensors();
    const known = new Set(sensors.map((sensor) => sensor.sensorId));
    if (readings.some((reading) => !known.has(reading.sensorId))) {
      return NextResponse.json(
        { error: "Register the sensor before importing readings" },
        { status: 422 },
      );
    }
    const result = await ingestSensorReadings(
      readings.map((reading) => ({
        ...reading,
        source: reading.source || `${reading.provider} import`,
      })),
    );
    const synced = new Set(readings.map((reading) => reading.sensorId));
    for (const sensor of sensors.filter((value) => synced.has(value.sensorId))) {
      await saveSensor({
        ...sensor,
        lastSyncAt: new Date().toISOString(),
        connectionStatus: "Connected",
      });
    }
    const notifications = await processClimateAlertNotifications();
    return NextResponse.json(
      { data: { ...result, notifications } },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid import" },
      { status: 422 },
    );
  }
}
