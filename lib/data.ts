import type { CigarCollection, EnvironmentalSensor, Humidor, HumidorReading, InventoryActivity, SmokingLog, Valuation } from "./types";
import { getActivities, getCollections, getHumidorReadings, getHumidors, getSensors, getSmokingLogs, getValuations } from "./smartsheet";
import { loadOwnedRecords } from "./user-data";

export const loadCollections=()=>loadOwnedRecords<CigarCollection>("collections",getCollections);
export const loadHumidors=()=>loadOwnedRecords<Humidor>("humidors",getHumidors);
export const loadHumidorReadings=()=>loadOwnedRecords<HumidorReading>("readings",getHumidorReadings);
export const loadSensors=()=>loadOwnedRecords<EnvironmentalSensor>("sensors",getSensors);
export const loadValuations=()=>loadOwnedRecords<Valuation>("valuations",getValuations);
export const loadSmokingLogs=()=>loadOwnedRecords<SmokingLog>("smokes",getSmokingLogs);
export const loadActivities=()=>loadOwnedRecords<InventoryActivity>("activities",getActivities);
