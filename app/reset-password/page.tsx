import { ResetPasswordForm } from "@/components/reset-password-form";
import "../login/login.css";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="loginShell"><section className="loginStory"><a className="appBrand" href="/"><span className="appBrandMark">CV</span><span><strong>Cigar Vault</strong><small>Collector intelligence</small></span></a><div><div className="eyebrow">Secure account recovery</div><h1>Choose a new password for your vault.</h1><p className="lede">Use at least eight characters and keep your collection protected.</p></div><small>Private accounts · Owner-controlled records · Climate intelligence</small></section><section className="loginPanel"><div><div className="eyebrow">New password</div><h2>Reset your password</h2><p>Enter and confirm the password you want to use.</p></div>{params.error&&<div className="loginMessage error">{params.error}</div>}<ResetPasswordForm/><p className="loginSwitch"><a href="/login">Back to sign in</a></p></section></main>;
}
