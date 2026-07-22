import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { redirect } from "next/navigation";
import { saveProfile } from "./actions";
import "./account.css";
import { FounderImport } from "@/components/founder-import";
import { billingConfigured, billingLabel } from "@/lib/billing";
import { accountPreferencesFromRow } from "@/lib/account-preferences";
import { AccountPreferencesPanel } from "@/components/account-preferences-panel";
import { buildAccountChecklist } from "@/lib/account-checklist";

export const dynamic = "force-dynamic";
export default async function AccountPage({searchParams}:{searchParams:Promise<{saved?:string;error?:string;checkout?:string}>}){
  const params=await searchParams;
  if(!supabaseConfigured())return <main className="shell"><div className="emptyState">Account service is not configured in this environment.</div></main>;
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
  const[{data:profile},{data:preferences},{data:checklistRecords}]=await Promise.all([supabase.from("profiles").select("display_name, collection_name, experience_level, onboarding_completed, billing_plan, billing_status, stripe_customer_id").eq("user_id",user.id).maybeSingle(),supabase.from("account_preferences").select("email_notifications,wishlist_alerts,valuation_research,rating_research,product_analytics,upgrade_recommendations").eq("user_id",user.id).maybeSingle(),supabase.from("vault_records").select("kind,payload").in("kind",["inventory","humidors","sensors"])]);
  const founder=profile?.billing_plan==="founder";
  const checklist=buildAccountChecklist(Boolean(profile?.onboarding_completed),checklistRecords||[]);
  const completed=checklist.filter(item=>item.complete).length;
  return <main className="shell accountShell"><section className="accountHero"><div><div className="eyebrow">Private collector profile</div><h1>{profile?.collection_name||"Set up your vault."}</h1><p className="lede">Personalize the collection attached to {user.email}.</p></div><form action={signOut}><button className="button secondary">Sign out</button></form></section>{params.saved&&<div className="loginMessage">Profile saved.</div>}{params.checkout==="success"&&<div className="loginMessage">Founder membership activated. Welcome to Cigar Vault.</div>}{params.error&&<div className="loginMessage error">{params.error}</div>}<section className="accountGrid"><form action={saveProfile} className="card accountForm"><div><div className="eyebrow">Account setup</div><h2>Collector details</h2></div><label><span>Your name</span><input name="displayName" defaultValue={profile?.display_name||String(user.user_metadata.full_name||"")} required/></label><label><span>Collection name</span><input name="collectionName" defaultValue={profile?.collection_name||"My Cigar Vault"} required/></label><label><span>Experience</span><select name="experienceLevel" defaultValue={profile?.experience_level||"Collector"}><option>New collector</option><option>Collector</option><option>Advanced collector</option><option>Industry professional</option></select></label><button className="button">Save profile</button></form><aside className="card onboardingCard"><div className="eyebrow">Getting started</div><h2>Your vault checklist</h2><p>{completed} of {checklist.length} complete</p>{checklist.map(item=><a href={item.href} key={item.label}><span className={item.complete?"done":""}>{item.complete?"✓":""}</span><strong>{item.label}</strong><small>{item.complete?"Done":"→"}</small></a>)}</aside></section><AccountPreferencesPanel initial={accountPreferencesFromRow(preferences)}/><section className="card billingCard"><div><div className="eyebrow">Membership</div><h2>{billingLabel(profile?.billing_plan,profile?.billing_status)}</h2><p>{founder?"Your annual Founder membership includes the complete collector platform.":"Upgrade to preserve the complete vault with founder-priority onboarding."}</p></div>{profile?.stripe_customer_id&&billingConfigured()?<form action="/api/billing/portal" method="post"><button className="button secondary">Manage billing</button></form>:<a className="button" href="/pricing">View Founder plan</a>}</section><FounderImport/></main>;
}
