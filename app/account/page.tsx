import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { redirect } from "next/navigation";
import { saveProfile } from "./actions";
import "./account.css";

export const dynamic = "force-dynamic";
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  if (!supabaseConfigured()) return <main className="shell"><div className="emptyState">Account service is not configured in this environment.</div></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name, collection_name, experience_level, onboarding_completed").eq("user_id", user.id).maybeSingle();
  return <main className="shell accountShell"><section className="accountHero"><div><div className="eyebrow">Private collector profile</div><h1>{profile?.collection_name || "Set up your vault."}</h1><p className="lede">Personalize the collection attached to {user.email}.</p></div><form action={signOut}><button className="button secondary">Sign out</button></form></section>{params.saved&&<div className="loginMessage">Profile saved.</div>}{params.error&&<div className="loginMessage error">{params.error}</div>}<section className="accountGrid"><form action={saveProfile} className="card accountForm"><div><div className="eyebrow">Account setup</div><h2>Collector details</h2></div><label><span>Your name</span><input name="displayName" defaultValue={profile?.display_name || String(user.user_metadata.full_name || "")} required/></label><label><span>Collection name</span><input name="collectionName" defaultValue={profile?.collection_name || "My Cigar Vault"} required/></label><label><span>Experience</span><select name="experienceLevel" defaultValue={profile?.experience_level || "Collector"}><option>New collector</option><option>Collector</option><option>Advanced collector</option><option>Industry professional</option></select></label><button className="button">Save profile</button></form><aside className="card onboardingCard"><div className="eyebrow">Getting started</div><h2>Your vault checklist</h2>{[["Account profile",Boolean(profile?.onboarding_completed),"/account"],["Add first cigar",false,"/inventory"],["Create a humidor",false,"/humidors"],["Connect a sensor",false,"/sensors"]].map(([label,done,href])=><a href={String(href)} key={String(label)}><span className={done?"done":""}>{done?"✓":""}</span><strong>{label}</strong><small>→</small></a>)}</aside></section></main>;
}
