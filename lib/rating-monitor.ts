import { z } from "zod";
import type { InventoryItem, ProfessionalRating } from "./types";
import { RatingResearchSchema } from "./cigar-ratings";

export const RatingDraftRecordSchema=z.object({inventoryId:z.string().min(1),researchedAt:z.string().datetime(),ratings:RatingResearchSchema.shape.ratings,notes:z.string(),acknowledgedNotificationIds:z.array(z.string()).optional()});
export type RatingDraftRecord=z.infer<typeof RatingDraftRecordSchema>;

export function ratingNeedsMonitoring(item:InventoryItem,ratings:ProfessionalRating[],draft:RatingDraftRecord|undefined,now=new Date()){
  if((item.currentQty??0)<=0)return false;
  if(draft?.ratings.length)return false;
  const latest=[...ratings.filter(rating=>rating.inventoryId===item.inventoryId).map(rating=>rating.createdAt),draft?.researchedAt].filter(Boolean).sort().at(-1);
  if(!latest)return true;
  const age=now.getTime()-new Date(latest).getTime();
  return !Number.isFinite(age)||age>=180*24*60*60*1000;
}
export function ratingMonitorPriority(item:InventoryItem,ratings:ProfessionalRating[]){const unrated=ratings.some(rating=>rating.inventoryId===item.inventoryId)?0:100000;return unrated+(item.retailValue??0)*(item.currentQty??0)+(item.currentQty??0)*10+(item.priority==="High"?1000:0)}
export function removeExistingRatingSources(candidates:RatingDraftRecord["ratings"],ratings:ProfessionalRating[],inventoryId:string){const existing=new Set(ratings.filter(rating=>rating.inventoryId===inventoryId).map(rating=>rating.sourceUrl));return candidates.filter((rating,index)=>!existing.has(rating.sourceUrl)&&candidates.findIndex(candidate=>candidate.sourceUrl===rating.sourceUrl)===index)}
