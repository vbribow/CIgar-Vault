import type { WishlistItem } from "@/lib/types";
export function wishlistNeedsMonitoring(item:WishlistItem,now=new Date(),staleHours=24){if(item.status!=="Watching"||item.targetPrice===undefined)return false;if(!item.availabilityLastCheckedAt)return true;const checked=new Date(item.availabilityLastCheckedAt).getTime();return !Number.isFinite(checked)||now.getTime()-checked>=staleHours*60*60*1000}
