import { updatePassword } from "../login/actions";
import "../login/login.css";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="loginShell"><section className="loginStory"><a className="appBrand" href="/"><span className="appBrandMark">CV</span><span><strong>Cigar Vault</strong><small>Collector intelligence</small></span></a><div><div className="eyebrow">Secure account recovery</div><h1>Choose a new password for your vault.</h1><p className="lede">Use at least eight characters and keep your collection protected.</p></div><small>Private accounts · Owner-controlled records · Climate intelligence</small></section><section className="loginPanel"><div><div className="eyebrow">New password</div><h2>Reset your password</h2><p>Enter and confirm the password you want to use.</p></div>{params.error&&<div className="loginMessage error">{params.error}</div>}<form action={updatePassword}><label><span>New password</span><input name="password" type="password" autoComplete="new-password" minLength={8} required/></label><label><span>Confirm new password</span><input name="confirmation" type="password" autoComplete="new-password" minLength={8} required/></label><button className="button">Update password</button></form><p className="loginSwitch"><a href="/login">Back to sign in</a></p></section></main>;
}
