import { NextResponse } from "next/server";
import { z } from "zod";
import { AccountExportSchema, buildRecoveryPreview, recordsForRecovery, RecoveryMode, recoveryConfirmationPhrase, recoveryOwnerMatch } from "@/lib/account-recovery";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

const Input=z.object({export:AccountExportSchema,mode:RecoveryMode,confirmation:z.string(),acknowledgeDifferentOwner:z.boolean().default(false)}).superRefine((value,context)=>{
  const expected=recoveryConfirmationPhrase(value.mode);
  if(value.confirmation!==expected)context.addIssue({code:"custom",path:["confirmation"],message:`Type ${expected} to confirm this recovery behavior`});
});

export async function POST(request:Request){
  if(!supabaseConfigured())return NextResponse.json({error:"Account service is not configured"},{status:503});
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in to restore a vault export"},{status:401});
  try{
    const input=Input.parse(await request.json());
    const ownerMatch=recoveryOwnerMatch(input.export.owner,{userId:user.id,email:user.email});
    if(ownerMatch==="different"&&!input.acknowledgeDifferentOwner)return NextResponse.json({error:"Confirm that this export belongs to you before restoring records from a different account identity."},{status:409});
    const{data:existing,error}=await supabase.from("vault_records").select("kind,record_id,payload,updated_at").eq("user_id",user.id);if(error)throw error;
    const preview=buildRecoveryPreview(input.export.records,existing||[]);
    const selected=recordsForRecovery(input.export.records,existing||[],input.mode);
    const restoredAt=new Date().toISOString();const auditId=`RECOVERY-${restoredAt}-${crypto.randomUUID()}`;
    const rows=[
      ...selected.map(record=>({user_id:user.id,kind:record.kind,record_id:record.record_id,payload:record.payload,updated_at:restoredAt})),
      {user_id:user.id,kind:"integrity" as const,record_id:auditId,payload:{action:"complete-vault-recovery",mode:input.mode,sourceCreatedAt:input.export.createdAt,sourceRecordCount:input.export.recordCount,sourceOwnerMatch:ownerMatch,restored:selected.length,preview,createdAt:restoredAt},updated_at:restoredAt},
    ];
    const{error:saveError}=await supabase.from("vault_records").upsert(rows,{onConflict:"user_id,kind,record_id"});if(saveError)throw saveError;
    return NextResponse.json({data:{auditId,restored:selected.length,mode:input.mode,ownerMatch,preview}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Vault recovery failed"},{status:error instanceof z.ZodError?422:502})}
}
