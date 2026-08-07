import { createClient } from "@supabase/supabase-js";
import type { BetaStage } from "./beta-onboarding";

const stageOrder:BetaStage[]=["Prospect","Invited","Signed up","Imported","Activated"];

export function privateBetaEnabled(
  value = process.env.BETA_INVITE_ONLY,
  environment = process.env.NODE_ENV,
) {
  if (value?.trim()) return value.trim().toLowerCase() === "true";
  return environment === "production";
}

export function normalizeBetaEmail(email: string) {
  return email.trim().normalize("NFKC").toLowerCase();
}

export async function requireBetaInvitation(email: string) {
  if (!privateBetaEnabled()) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Private beta enrollment is temporarily unavailable.");
  }
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin
    .from("beta_collectors")
    .select("id,stage")
    .eq("email", normalizeBetaEmail(email))
    .maybeSingle();
  if (error) throw new Error("Private beta enrollment is temporarily unavailable.");
  if (!data) {
    throw new Error("This private beta is invitation-only. Use the email address Brian invited.");
  }
  if(data.stage==="Prospect"){
    const now=new Date().toISOString();
    const{error:advanceError}=await admin.from("beta_collectors").update({stage:"Invited",invited_at:now,updated_at:now}).eq("id",data.id).eq("stage","Prospect");
    if(advanceError?.code==="23514")throw new Error("The private beta cohort is currently full.");
    if(advanceError)throw new Error("Private beta enrollment is temporarily unavailable.");
  }
}

export async function advanceBetaCollectorStage(email:string|undefined,target:BetaStage){
  if(!email)return false;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if(!url||!key)return false;
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const normalized=normalizeBetaEmail(email);
  const{data,error}=await admin.from("beta_collectors").select("id,stage").eq("email",normalized).maybeSingle();
  if(error||!data)return false;
  const current=data.stage as BetaStage;
  if(stageOrder.indexOf(target)<=stageOrder.indexOf(current))return true;
  const now=new Date().toISOString();
  const{error:updateError}=await admin.from("beta_collectors").update({stage:target,invited_at:now,updated_at:now}).eq("id",data.id).eq("stage",current);
  return !updateError;
}
