"use client";

import { useEffect, useState } from "react";

const warning = "You have unsaved changes. Leave this page and discard them?";

export function useUnsavedChanges() {
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const protectInternalNavigation = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (!window.confirm(warning)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    let restoringHistory = false;
    const protectHistoryNavigation = () => {
      if (restoringHistory) { restoringHistory = false; return; }
      if (!window.confirm(warning)) {
        restoringHistory = true;
        window.history.forward();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", protectHistoryNavigation);
    document.addEventListener("click", protectInternalNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", protectHistoryNavigation);
      document.removeEventListener("click", protectInternalNavigation, true);
    };
  }, [dirty]);

  return { dirty, markDirty: () => setDirty(true), markSaved: () => setDirty(false) };
}
