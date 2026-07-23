import { PasswordRecoveryForm } from "@/components/password-recovery-form";
import { CedrivaMark } from "@/components/cedriva-mark";
import "@/app/login/login.css";

export const dynamic="force-dynamic";
export default function RecoverPage(){return <main className="loginShell"><section className="loginStory"><a className="appBrand" href="/"><CedrivaMark/><span><strong>Cedriva</strong><small>Premium cigar culture</small></span></a><div><div className="eyebrow">Secure account recovery</div><h1>Return safely to your private vault.</h1><p className="lede">Request one recovery email, then open only its newest link.</p></div><small>Cross-browser recovery · One-time link · Private account</small></section><section className="loginPanel"><div><div className="eyebrow">Account recovery</div><h2>Reset your password</h2><p>This recovery request is created on the server so the email can open safely in another window.</p></div><PasswordRecoveryForm/><p className="loginSwitch">Remember your password? <a href="/login">Sign in</a></p></section></main>}
