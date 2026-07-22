import { NextResponse } from "next/server";
import { z } from "zod";
import { AccountExportSchema, buildRecoveryPreview, recordsForRecovery, RecoveryMode } from "@/lib/account-recovery";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

const Input=z.object({export:AccountExportSchema,mode:RecoveryMode,confirmation:z.literal("RESTORE")});

export async function POST(request:Request){
  if(!supabaseConfigured())return NextResponse.json({error:"Account service is not configured"},{status:503});
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in to restore a vault export"},{status:401});
  try{
    const input=Input.parse(await request.json());
    const{data:existing,error}=await supabase.from("vault_records").select("kind,record_id,payload,updated_at");if(error)throw error;
    const preview=buildRecoveryPreview(input.export.records,existing||[]);
    const selected=recordsForRecovery(input.export.records,existing||[],input.mode);
    for(let index=0;index<selected.length;index+=500){const rows=selected.slice(index,index+500).map(record=>({user_id:user.id,kind:record.kind,record_id:record.record_id,payload:record.payload,updated_at:new Date().toISOString()}));const{error:saveError}=await supabase.from("vault_records").upsert(rows,{onConflict:"user_id,kind,record_id"});if(saveError)throw saveError}
    const restoredAt=new Date().toISOString();const auditId=`RECOVERY-${restoredAt}-${crypto.randomUUID()}`;
    const{error:auditError}=await supabase.from("vault_records").upsert({user_id:user.id,kind:"integrity",record_id:auditId,payload:{action:"complete-vault-recovery",mode:input.mode,sourceCreatedAt:input.export.createdAt,sourceRecordCount:input.export.recordCount,restored:selected.length,preview,createdAt:restoredAt},updated_at:restoredAt},{onConflict:"user_id,kind,record_id"});if(auditError)throw auditError;
    return NextResponse.json({data:{auditId,restored:selected.length,mode:input.mode,preview}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Vault recovery failed"},{status:error instanceof z.ZodError?422:502})}
}
