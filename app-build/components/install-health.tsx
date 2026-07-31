"use client";

import { useEffect, useState } from "react";
import { canonicalAppOrigin, installConfirmationEvent, isCanonicalAppHost } from "@/lib/app-install";

type ServiceState = "Checking" | "Ready" | "Unavailable";

export function InstallHealth({ version }: { version: string }) {
  const [host, setHost] = useState("");
  const [online, setOnline] = useState(true);
  const [standalone, setStandalone] = useState(false);
  const [serviceWorker, setServiceWorker] = useState<ServiceState>("Checking");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const canonical = !host || isCanonicalAppHost(host);

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    const installed = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setHost(window.location.hostname);
    setStandalone(installed);
    try { setConfirmed(localStorage.getItem("hojavia:install-confirmed:v1") === "1"); } catch { /* confirmation remains session-only */ }
    setServiceWorker("serviceWorker" in navigator ? "Checking" : "Unavailable");
    if ("serviceWorker" in navigator) void navigator.serviceWorker.getRegistration().then(registration => setServiceWorker(registration ? "Ready" : "Unavailable")).catch(() => setServiceWorker("Unavailable"));
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => { window.removeEventListener("online", updateConnection); window.removeEventListener("offline", updateConnection); };
  }, []);

  async function confirmInstallation() {
    if (busy) return;
    setBusy(true);setMessage("");
    try {
      const response = await fetch("/api/product-events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType: installConfirmationEvent, properties: { host, version, standalone: String(standalone) } }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Confirmation could not be recorded");
      try { localStorage.setItem("hojavia:install-confirmed:v1", "1"); } catch { /* server confirmation remains authoritative */ }
      setConfirmed(true);
      setMessage(result.data?.recorded ? "This phone is confirmed for founder beta support." : "The app works on this phone. Sign in to attach confirmation to your beta record.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Confirmation could not be recorded"); }
    finally { setBusy(false); }
  }

  return <div className="installHealth">
    {!canonical&&<section className="card installWarning"><div className="eyebrow">Old installation detected</div><h2>Move this phone to the permanent Hojavía address.</h2><p>This copy opened from <strong>{host}</strong>. Delete its home-screen icon, then open the permanent site in Safari.</p><a className="button" href={`${canonicalAppOrigin}/install`}>Open permanent installer</a></section>}
    <section className="card installSteps"><div><div className="eyebrow">One-time phone setup</div><h2>Install the permanent app.</h2><p>No special Wi-Fi connection is required.</p></div><ol><li>Delete any Hojavía icon created from a local IP address or preview link.</li><li>Open <a href={`${canonicalAppOrigin}/install`}>hojavia.com/install</a> directly in Safari on iPhone or Chrome on Android.</li><li>Choose <strong>Share → Add to Home Screen</strong> on iPhone, or <strong>Install app</strong> from Chrome’s menu on Android.</li><li>Open the new icon, sign in, and return here to confirm this phone.</li></ol></section>
    <section className="installStatusGrid" aria-label="App installation diagnostics"><article className={canonical?"ready":"attention"}><span>Address</span><strong>{canonical?"Permanent":"Replace"}</strong><small>{host||"Checking…"}</small></article><article className={online?"ready":"attention"}><span>Connection</span><strong>{online?"Online":"Offline"}</strong><small>{online?"Server reachable":"Reconnect and try again"}</small></article><article className={serviceWorker==="Ready"?"ready":"attention"}><span>Update service</span><strong>{serviceWorker}</strong><small>{serviceWorker==="Ready"?"Automatic updates enabled":"Reload from the permanent address"}</small></article><article className={standalone?"ready":"attention"}><span>Home screen</span><strong>{standalone?"Installed":"Browser"}</strong><small>{standalone?"Running as an app":"Add to Home Screen when ready"}</small></article></section>
    <section className="card installConfirm"><div><div className="eyebrow">Support confirmation</div><h2>{confirmed?"This phone is confirmed.":"Does the new app open correctly?"}</h2><p>Build <strong>{version}</strong> · Permanent host <strong>hojavia.com</strong></p></div><button className="button" disabled={busy||confirmed||!online||!canonical} onClick={confirmInstallation}>{busy?"Confirming…":confirmed?"Confirmed ✓":"Confirm this phone"}</button>{message&&<output aria-live="polite">{message}</output>}</section>
  </div>;
}
