import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { redirect } from "next/navigation";
import { recordBetaConsent, saveProfile } from "./actions";
import "./account.css";
import { FounderImport } from "@/components/founder-import";
import { billingConfigured, billingLabel } from "@/lib/billing";
import { accountPreferencesFromRow } from "@/lib/account-preferences";
import { AccountPreferencesPanel } from "@/components/account-preferences-panel";
import { buildAccountChecklist } from "@/lib/account-checklist";
import { accountSecuritySummary, type AccountVaultRecord } from "@/lib/account-security";
import { VaultRecoveryPanel } from "@/components/vault-recovery-panel";
import { AccountChecklistPanel } from "@/components/account-checklist-panel";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; checkout?: string }> }) {
  const params = await searchParams;
  if (!supabaseConfigured()) return <main className="shell"><div className="emptyState">Account service is not configured in this environment.</div></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [profileResult, preferencesResult, vaultResult, consentResult] = await Promise.all([
    supabase.from("profiles").select("display_name, collection_name, experience_level, onboarding_completed, billing_plan, billing_status, stripe_customer_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("account_preferences").select("email_notifications,wishlist_alerts,valuation_research,rating_research,product_analytics,upgrade_recommendations").eq("user_id", user.id).maybeSingle(),
    supabase.from("vault_records").select("kind,record_id,payload,updated_at").eq("user_id", user.id),
    supabase.from("account_consents").select("age_confirmed_at,terms_version,terms_accepted_at,privacy_version,privacy_accepted_at,beta_version,beta_accepted_at").eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileResult.error || preferencesResult.error || vaultResult.error || consentResult.error) return <main className="shell accountShell"><section className="section card"><div className="eyebrow">Account records protected</div><h1>Your account controls are temporarily paused.</h1><p className="lede">{brand.name} could not verify profile, preferences, private Vault records, and consent together. Nothing is being shown as missing, expired, or reset.</p><a className="button secondary" href="/account">Try again</a></section></main>;
  const profile = profileResult.data, preferences = preferencesResult.data, vaultRecords = vaultResult.data, consent = consentResult.data;
  const founder = profile?.billing_plan === "founder" && ["active", "trialing"].includes(profile?.billing_status || "");
  const records = (vaultRecords || []) as AccountVaultRecord[];
  const checklist = buildAccountChecklist(Boolean(profile?.onboarding_completed), records);
  const security = accountSecuritySummary(records);
  return <main className="shell accountShell">
    <section className="accountHero"><div><div className="eyebrow">Private collector profile</div><h1>{profile?.collection_name || "Set up your vault."}</h1><p className="lede">Personalize the collection attached to {user.email}.</p></div><form action={signOut}><button className="button secondary">Sign out</button></form></section>
    {params.saved && <div className="loginMessage">{params.saved === "consent" ? "Consent record saved." : "Profile saved."}</div>}
    {params.checkout === "success" && <div className="loginMessage">Founder membership activated. Welcome to {brand.name}.</div>}
    {params.error && <div className="loginMessage error">{params.error}</div>}
    <section className="accountGrid">
      <form action={saveProfile} className="card accountForm"><div><div className="eyebrow">Account setup</div><h2>Collector details</h2></div><label><span>Your name</span><input name="displayName" defaultValue={profile?.display_name || String(user.user_metadata.full_name || "")} required /></label><label><span>Collection name</span><input name="collectionName" defaultValue={profile?.collection_name || "My "} required /></label><label><span>Experience</span><select name="experienceLevel" defaultValue={profile?.experience_level || "Collector"}><option>New collector</option><option>Collector</option><option>Advanced collector</option><option>Industry professional</option></select></label><button className="button">Save profile</button></form>
      <AccountChecklistPanel items={checklist} />
    </section>
    <AccountPreferencesPanel initial={accountPreferencesFromRow(preferences)} />
    <section className="card consentCard"><div><div className="eyebrow">Private beta consent</div><h2>{consent ? "Recorded and visible" : "Confirm beta participation"}</h2><p>{consent ? `Beta agreement ${consent.beta_version} accepted ${new Date(consent.beta_accepted_at).toLocaleDateString()}.` : "Review the current notices and create the same auditable consent record required for every beta collector."}</p></div>{consent ? <div><a href="/privacy">Privacy Notice</a><a href="/terms">Terms</a><a href="/beta-agreement">Beta Agreement</a></div> : <form action={recordBetaConsent} className="consentForm"><label><input name="ageConfirmation" type="checkbox" required />I am of legal age where I live and at least 21.</label><label><input name="termsAcceptance" type="checkbox" required />I accept the <a href="/terms">Terms</a> and <a href="/beta-agreement">Beta Agreement</a>.</label><label><input name="privacyAcceptance" type="checkbox" required />I accept the <a href="/privacy">Privacy Notice</a>.</label><button className="button">Record consent</button></form>}</section>
    <section className="card securityCard"><div className="securityHead"><div><div className="eyebrow">Security & data</div><h2>Control access. Keep a recoverable copy.</h2><p>Your account export contains every private Vault record plus a profile and preference snapshot. It does not include your password, consent history, or billing credentials, and downloading it changes nothing.</p></div><span className={user.email_confirmed_at ? "secure" : "attention"}>{user.email_confirmed_at ? "Email verified" : "Verify email"}</span></div><div className="securityMetrics"><article><span>Private records</span><strong>{security.recordCount}</strong><small>Across inventory, collections, climate, values, and history</small></article><article><span>Last inventory backup</span><strong>{security.lastBackupAt ? new Date(security.lastBackupAt).toLocaleDateString() : "Not yet"}</strong><small>{security.lastBackupCount === undefined ? "Download a backup to establish a recovery point" : `${security.lastBackupCount} inventory lots preserved`}</small></article><article><span>Last sign-in</span><strong>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Current session"}</strong><small>{user.email}</small></article></div><div className="securityActions"><a className="button" href="/api/account/export">Download account data copy</a><a className="button secondary" href="/inventory-integrity">Backup & integrity center</a><a className="textLink" href="/login?mode=forgot">Reset password →</a></div><div className="deviceContinuity"><strong>Moving to another device?</strong><p>Sign in with the same verified email to load account-backed Vault records. Unsubmitted browser drafts and selected photos stay on the original device; download an account data copy before changing devices.</p></div><VaultRecoveryPanel /></section>
    <section className="card billingCard"><div><div className="eyebrow">Membership</div><h2>{billingLabel(profile?.billing_plan, profile?.billing_status)}</h2><p>{founder ? "Your annual Founder membership includes the complete collector platform." : "Upgrade to preserve the complete vault with founder-priority onboarding."}</p></div>{profile?.stripe_customer_id && billingConfigured() ? <form action="/api/billing/portal" method="post"><button className="button secondary">Manage billing</button></form> : <a className="button" href="/pricing">View Founder plan</a>}</section>
    <FounderImport />
  </main>;
}
