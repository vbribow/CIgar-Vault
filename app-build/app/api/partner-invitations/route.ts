import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { partnerAdmin } from "@/lib/partner-platform";
import { hashInvitationToken, invitationExpired } from "@/lib/partner-workspace";

const Token=z.string().min(30).max(200);
const invitationError=(error:unknown,fallback:string)=>
  error instanceof z.ZodError
    ? "This invitation link is invalid or incomplete."
    : error instanceof Error
      ? error.message
      : fallback;

async function lookup(token:string){
  const admin=partnerAdmin();
  if(!admin)throw new Error("Partner invitation service is not configured");
  const hash=hashInvitationToken(token);
  const{data,error}=await admin.from("partner_memberships")
    .select("*,partners(id,name,slug,collaboration_locked,collaboration_lock_reason)")
    .eq("invitation_token_hash",hash).eq("status","invited").maybeSingle();
  if(error)throw error;
  if(!data||!data.invitation_expires_at||invitationExpired(data.invitation_expires_at))throw new Error("This invitation is invalid or has expired");
  const partner=data.partners as unknown as{collaboration_locked:boolean;collaboration_lock_reason?:string;name:string;slug:string};
  if(partner.collaboration_locked)throw new Error(partner.collaboration_lock_reason||"This collaboration is founder-locked");
  return{admin,membership:data,partner};
}
export async function GET(request:Request){
  try{
    const token=Token.parse(new URL(request.url).searchParams.get("token"));
    const{membership,partner}=await lookup(token);
    return NextResponse.json({data:{partnerName:partner.name,partnerSlug:partner.slug,displayName:membership.display_name,role:membership.role,expiresAt:membership.invitation_expires_at}});
  }catch(error){
    return NextResponse.json({error:invitationError(error,"Invitation unavailable")},{status:404});
  }
}

export async function POST(request:Request){
  if(!supabaseConfigured())return NextResponse.json({error:"Account service is not configured"},{status:503});
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in with the invited email address"},{status:401});
  try{
    const token=Token.parse((await request.json() as{token?:unknown}).token);
    const{admin,membership,partner}=await lookup(token);
    if(!user.email||user.email.toLowerCase()!==String(membership.invited_email).toLowerCase())throw new Error("Sign in with the exact email address that received this invitation");
    if(!user.email_confirmed_at)throw new Error("Confirm your email address before accepting a partner invitation");
    const now=new Date().toISOString();
    const{data,error}=await admin.from("partner_memberships").update({user_id:user.id,status:"active",accepted_at:now,last_accessed_at:now,invitation_token_hash:null,updated_at:now}).eq("id",membership.id).eq("status","invited").select().single();
    if(error)throw error;
    await admin.from("partner_audit_events").insert({partner_id:data.partner_id,actor:`partner:${user.id}`,action:"membership.accepted",subject_type:"membership",subject_id:data.id,details:{role:data.role}});
    return NextResponse.json({data:{partnerName:partner.name,role:data.role,workspacePath:"/partner-workspace"}});
  }catch(error){
    return NextResponse.json({error:invitationError(error,"Unable to accept invitation")},{status:422});
  }
}
