"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";

const GlobalSearch = dynamic(
  () => import("@/components/global-search").then(module => module.GlobalSearch),
  { loading: () => <button className="globalSearchTrigger" type="button" disabled aria-label={`Preparing ${brand.name} search`}><span>⌕</span><b>Search</b><kbd>⌘ K</kbd></button> },
);

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function DeferredGlobalSearch() {
  const [ready, setReady] = useState(false);
  const [openOnLoad, setOpenOnLoad] = useState(false);

  useEffect(() => {
    if (ready) return;
    const prepare = () => setReady(true);
    const open = () => { setOpenOnLoad(true); setReady(true); };
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", key);
    window.addEventListener("hojavia:open-search", open);
    const idleWindow = window as IdleWindow;
    const idleHandle = idleWindow.requestIdleCallback?.(prepare, { timeout: 2200 });
    const fallback = idleHandle === undefined ? window.setTimeout(prepare, 1800) : undefined;
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("hojavia:open-search", open);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (fallback !== undefined) window.clearTimeout(fallback);
    };
  }, [ready]);

  if (ready) return <GlobalSearch initialOpen={openOnLoad}/>;
  return <button className="globalSearchTrigger" type="button" onClick={() => { setOpenOnLoad(true); setReady(true); }} aria-label={`Search ${brand.name}`}><span>⌕</span><b>Search</b><kbd>⌘ K</kbd></button>;
}
