import { FounderInstallStatus } from "@/components/founder-install-status";
import "./founder-install-status.css";

export default function FounderInstallStatusPage(){return <main className="shell wideShell founderInstallPage"><section className="founderInstallHero"><div><div className="eyebrow">Phone-app readiness</div><h1>Know which testers are actually connected.</h1><p className="lede">Separate account creation, successful login, and confirmed installation on the permanent Hojavía address.</p></div><div><a className="button secondary" href="/founder-beta-activity">Tester activity</a><a className="button secondary" href="/founder-onboarding">Back to onboarding</a></div></section><FounderInstallStatus/></main>}
