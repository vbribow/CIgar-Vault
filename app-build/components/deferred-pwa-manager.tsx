"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { InstallEvent } from "@/components/pwa-manager";

const PwaManager = dynamic(
  () => import("@/components/pwa-manager").then(module => module.PwaManager),
  { loading: () => null },
);

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function DeferredPwaManager() {
  const [ready, setReady] = useState(false);
  const [initialEvent, setInitialEvent] = useState<InstallEvent>();

  useEffect(() => {
    if (ready) return;
    const prepare = () => setReady(true);
    const captureInstall = (event: Event) => {
      event.preventDefault();
      setInitialEvent(event as InstallEvent);
      setReady(true);
    };
    window.addEventListener("beforeinstallprompt", captureInstall);
    const idleWindow = window as IdleWindow;
    const idleHandle = idleWindow.requestIdleCallback?.(prepare, { timeout: 2600 });
    const fallback = idleHandle === undefined ? window.setTimeout(prepare, 2200) : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstall);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (fallback !== undefined) window.clearTimeout(fallback);
    };
  }, [ready]);

  return ready ? <PwaManager initialEvent={initialEvent}/> : null;
}
