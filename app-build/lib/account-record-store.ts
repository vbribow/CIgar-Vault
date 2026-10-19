import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountVaultRecord={kind:string;record_id:string;payload:unknown;updated_at:string};

const accountRecordPageSize=1000;

export const portableAccountRecordKinds=[
  "inventory",
  "collections",
  "humidors",
  "sensors",
  "valuations",
  "ratings",
  "rating-drafts",
  "smokes",
  "activities",
  "wishlist",
] as const;

export async function loadAllAccountVaultRecords(client:SupabaseClient,userId:string,kinds?:readonly string[]):Promise<AccountVaultRecord[]>{
  const records:AccountVaultRecord[]=[];
  for(let from=0;;from+=accountRecordPageSize){
    let query=client.from("vault_records").select("kind,record_id,payload,updated_at").eq("user_id",userId);
    if(kinds?.length)query=query.in("kind",[...kinds]);
    const{data,error}=await query.order("kind").order("record_id").range(from,from+accountRecordPageSize-1);
    if(error)throw error;
    const page=(data||[]) as AccountVaultRecord[];
    records.push(...page);
    if(page.length<accountRecordPageSize)return records;
  }
}

export async function loadAccountDashboardRecords(client:SupabaseClient,userId:string):Promise<AccountVaultRecord[]>{
  const[portableRecords,integrityResult]=await Promise.all([
    loadAllAccountVaultRecords(client,userId,portableAccountRecordKinds),
    client.from("vault_records").select("kind,record_id,payload,updated_at").eq("user_id",userId).eq("kind","integrity").order("updated_at",{ascending:false}).limit(50),
  ]);
  if(integrityResult.error)throw integrityResult.error;
  return[...portableRecords,...((integrityResult.data||[]) as AccountVaultRecord[])];
}
