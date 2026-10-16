import { NextResponse } from "next/server";
import { AccountExportSchema, buildRecoveryPreview, recoveryOwnerMatch } from "@/lib/account-recovery";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { loadAllAccountVaultRecords } from "@/lib/account-record-store";

export async function POST(request:Request){
  if(!supabaseConfigured())return NextResponse.json({error:"Account service is not configured"},{status:503});
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in to inspect a vault export"},{status:401});
  try{
    const parsed=AccountExportSchema.parse(await request.json());
    const records=await loadAllAccountVaultRecords(supabase,user.id);
    return NextResponse.json({data:{source:{createdAt:parsed.createdAt,email:parsed.owner.email,recordCount:parsed.recordCount,ownerMatch:recoveryOwnerMatch(parsed.owner,{userId:user.id,email:user.email})},preview:buildRecoveryPreview(parsed.records,records)}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid vault export"},{status:422})}
}
