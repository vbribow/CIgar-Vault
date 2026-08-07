import type { CigarCollection, EnvironmentalSensor, Humidor, HumidorReading, InventoryActivity, ProfessionalRating, SmokingLog, Valuation, WishlistItem } from "./types";
import { dataMode } from "./config";
import { getActivities, getCollections, getHumidorReadings, getHumidors, getSensors, getSmokingLogs, getValuations } from "./smartsheet";
import { loadPreviewCollections } from "./preview-collections";
import { loadPreviewValuations } from "./preview-valuations";
import { loadAccountRecords, loadOwnedRecords } from "./user-data";
import type { RatingDraftRecord } from "./rating-monitor";

export const loadCollections=async()=>{
  const accountCollections=await loadAccountRecords<CigarCollection>("collections");
  if(accountCollections!==undefined)return accountCollections;
  return dataMode()==="mock"?loadPreviewCollections():[];
};
export const loadHumidors=()=>loadOwnedRecords<Humidor>("humidors",getHumidors);
export const loadHumidorReadings=()=>loadOwnedRecords<HumidorReading>("readings",getHumidorReadings);
export const loadSensors=()=>loadOwnedRecords<EnvironmentalSensor>("sensors",getSensors);
export const loadValuations=async()=>{
  const accountValuations=await loadAccountRecords<Valuation>("valuations");
  const values=accountValuations!==undefined
    ? accountValuations
    : dataMode()==="mock"
      ? await loadPreviewValuations()
      : [];
  return values.filter(value=>!value.invalidatedAt);
};
export const loadRatings=()=>loadOwnedRecords<ProfessionalRating>("ratings",async()=>[]);
export const loadRatingDrafts=()=>loadOwnedRecords<RatingDraftRecord>("rating-drafts",async()=>[]);
export const loadSmokingLogs=()=>loadOwnedRecords<SmokingLog>("smokes",getSmokingLogs);
export const loadActivities=()=>loadOwnedRecords<InventoryActivity>("activities",getActivities);
export const loadWishlist=()=>loadOwnedRecords<WishlistItem>("wishlist",async()=>[]);
