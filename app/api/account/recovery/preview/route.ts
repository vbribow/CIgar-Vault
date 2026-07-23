import { NextResponse } from "next/server";
import { AccountExportSchema, buildRecoveryPreview } from "@/lib/account-recovery";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export async function POST(request:Request){
  if(!supabaseConfigured())return NextResponse.json({error:"Account service is not configured"},{status:503});
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in to inspect a vault export"},{status:401});
  try{
    const parsed=AccountExportSchema.parse(await request.json());
    const{data,error}=await supabase.from("vault_records").select("kind,record_id,payload,updated_at");if(error)throw error;
    return NextResponse.json({data:{source:{createdAt:parsed.createdAt,email:parsed.owner.email,recordCount:parsed.recordCount},preview:buildRecoveryPreview(parsed.records,data||[])}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid vault export"},{status:422})}
}
