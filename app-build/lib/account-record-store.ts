import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountVaultRecord={kind:string;record_id:string;payload:unknown;updated_at:string};

const accountRecordPageSize=1000;

export async function loadAllAccountVaultRecords(client:SupabaseClient,userId:string):Promise<AccountVaultRecord[]>{
  const records:AccountVaultRecord[]=[];
  for(let from=0;;from+=accountRecordPageSize){
    const{data,error}=await client.from("vault_records").select("kind,record_id,payload,updated_at").eq("user_id",userId).order("kind").order("record_id").range(from,from+accountRecordPageSize-1);
    if(error)throw error;
    const page=(data||[]) as AccountVaultRecord[];
    records.push(...page);
    if(page.length<accountRecordPageSize)return records;
  }
}
