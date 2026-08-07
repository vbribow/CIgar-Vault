import type { Metadata } from "next";
import { HojaviaMark } from "@/components/hojavia-mark";
import { InstallHealth } from "@/components/install-health";
import { appBuildVersion } from "@/lib/app-install";
import "./install.css";

export const metadata: Metadata = { title: "Install Hojavía", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function InstallPage() {
  return <main className="shell installPage"><section className="installHero"><HojaviaMark/><div><div className="eyebrow">Permanent phone app</div><h1>Install Hojavía once. Keep receiving updates.</h1><p className="lede">Use this page whenever a home-screen icon reports that the server is unavailable or the app may be outdated.</p></div></section><InstallHealth version={appBuildVersion()}/></main>;
}
