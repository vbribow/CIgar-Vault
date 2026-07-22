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
    return NextResponse.json({data:{sent:true,cooldownSeconds:65*60}});
  }catch(error){
    const message=error instanceof Error?error.message:"Unable to send recovery email";
    const rateLimited=message.toLowerCase().includes("rate limit");
    return NextResponse.json({error:rateLimited?"Supabase did not send an email because its hourly limit is active. Wait for the countdown to finish, then try exactly once.":message,...(rateLimited?{retryAfterSeconds:65*60}:{})},{status:error instanceof z.ZodError?422:429,headers:rateLimited?{"Retry-After":String(65*60)}:undefined});
  }
}
