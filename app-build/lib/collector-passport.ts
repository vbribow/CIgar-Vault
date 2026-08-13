import { z } from "zod";
import { cigarTradition } from "./cigar-lineage";
import type { InventoryItem, SmokingLog } from "./types";

const list=z.array(z.string().trim().min(1).max(80)).max(8);
export const CollectorPassportInput=z.object({handle:z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/),displayName:z.string().trim().min(2).max(50),bio:z.string().trim().max(400),yearsCollecting:z.coerce.number().int().min(0).max(100).optional(),interests:list,favoriteOrigins:list,favoriteMakers:list,favoriteVitolas:list,featuredCigars:z.array(z.string().trim().min(2).max(140)).max(5),visibility:z.enum(["private","community"])}).strict();
export type CollectorPassport=z.infer<typeof CollectorPassportInput>&{updatedAt?:string};
const frequency=(values:string[])=>[...values.reduce((map,value)=>map.set(value,(map.get(value)||0)+1),new Map<string,number>())].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([value])=>value);
export function collectorPassportSuggestions(inventory:InventoryItem[],smokes:SmokingLog[]){
  const active=inventory.filter(item=>(item.currentQty??0)>0),brands=frequency(active.map(item=>item.brand)).slice(0,5),vitolas=frequency(active.map(item=>item.vitola)).slice(0,5),traditions=[...new Set(active.map(item=>cigarTradition(item.brand)).filter(value=>value!=="Unresolved"))];
  const positive=smokes.filter(item=>(item.overall??0)>=90||item.buyAgain).sort((a,b)=>(b.overall??0)-(a.overall??0)).slice(0,5).map(smoke=>smoke.cigarName||[smoke.cigarBrand,smoke.cigarLine,smoke.cigarVitola].filter(Boolean).join(" ")).filter(Boolean);
  return{favoriteMakers:brands,favoriteVitolas:vitolas,favoriteOrigins:traditions,featuredCigars:positive,interests:["Cigar culture","Collection stewardship"]};
}
export function publicPassportShape(row:Record<string,unknown>):CollectorPassport{return CollectorPassportInput.parse({handle:row.handle,displayName:row.display_name,bio:row.bio||"",yearsCollecting:row.years_collecting??undefined,interests:row.interests||[],favoriteOrigins:row.favorite_origins||[],favoriteMakers:row.favorite_makers||[],favoriteVitolas:row.favorite_vitolas||[],featuredCigars:row.featured_cigars||[],visibility:row.visibility})}
