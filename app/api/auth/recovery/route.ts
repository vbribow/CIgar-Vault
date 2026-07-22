import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { appOrigin } from "@/lib/app-origin";
import { recoveryAuthOptions } from "@/lib/supabase/recovery-client";

const Input=z.object({email:z.string().trim().email()});

export async function POST(request:Request){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if(!url||!key)return NextResponse.json({error:"Authentication is not configured"},{status:503});
  try{
    const{email}=Input.parse(await request.json());
    const origin=appOrigin(new URL(request.url).origin,process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL);
    const supabase=createClient(url,key,{auth:{...recoveryAuthOptions,persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/reset-password`});
    if(error)throw error;
    return NextResponse.json({data:{sent:true}});
  }catch(error){
    const message=error instanceof Error?error.message:"Unable to send recovery email";
    return NextResponse.json({error:message==="email rate limit exceeded"?"Too many recovery emails were requested. Wait for the hourly limit to reset, then try once.":message},{status:error instanceof z.ZodError?422:429});
  }
}
