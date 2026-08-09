"use client";

import { useEffect, useState } from "react";

type ConnectionState = "online" | "offline" | "restored";

export function ConnectionStatus() {
  const [state, setState] = useState<ConnectionState>("online");

  useEffect(() => {
    let restoredTimer: number | undefined;
    const offline = () => {
      window.clearTimeout(restoredTimer);
      setState("offline");
    };
    const online = () => {
      setState(current => current === "offline" ? "restored" : "online");
      window.clearTimeout(restoredTimer);
      restoredTimer = window.setTimeout(() => setState("online"), 4500);
    };
    if (!navigator.onLine) offline();
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      window.clearTimeout(restoredTimer);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, []);

  if (state === "online") return null;
  return <aside className={`connectionStatus ${state}`} role="status" aria-live="assertive" aria-atomic="true">
    <div>
      <strong>{state === "offline" ? "Connection interrupted" : "You’re back online"}</strong>
      <small>{state === "offline" ? "Private saves and searches are paused. Nothing is being treated as missing or changed." : "You can safely continue. Any unfinished form entries remain on this screen."}</small>
    </div>
    {state === "offline" && <button type="button" onClick={() => window.location.reload()}>Try again</button>}
  </aside>;
}
