"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const storageKey = "hojavia:last-safe-task:v1";
const safeTasks = [
  ["/inventory", "My collection"],
  ["/records", "Log a smoke"],
  ["/smoke-journal", "Smoking journal"],
  ["/collections", "Valuable collections"],
  ["/verification", "Verification workspace"],
  ["/cigar-somm", "Cigar guide"],
  ["/community", "Collector community"],
  ["/places", "Places"],
  ["/wishlist", "Wishlist"],
  ["/reports", "Reports"],
  ["/learn", "Learning library"],
  ["/account", "Account"],
] as const;

type SafeTask = { href: string; label: string };

function taskForPath(pathname: string): SafeTask | undefined {
  const match = safeTasks.find(([route]) => pathname === route || pathname.startsWith(`${route}/`));
  return match ? { href: match[0], label: match[1] } : undefined;
}

export function TaskContinuity() {
  const pathname = usePathname();
  const [resume, setResume] = useState<SafeTask>();

  useEffect(() => {
    try {
      if (pathname === "/") {
        const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "null") as SafeTask | null;
        const safe = parsed && safeTasks.some(([href, label]) => href === parsed.href && label === parsed.label);
        setResume(safe ? parsed! : undefined);
        return;
      }
      const task = taskForPath(pathname);
      if (task) window.localStorage.setItem(storageKey, JSON.stringify(task));
      setResume(undefined);
    } catch {
      setResume(undefined);
    }
  }, [pathname]);

  if (pathname !== "/" || !resume) return null;
  return <aside className="taskContinuity" aria-label="Resume where I left off">
    <div><span>Continue your work</span><strong>{resume.label}</strong><small>Only the workspace name is remembered on this device—never cigar details or private record contents.</small></div>
    <div><Link className="button" href={resume.href}>Resume where I left off</Link><button type="button" className="textLink" onClick={() => { try { window.localStorage.removeItem(storageKey); } catch {} setResume(undefined); }}>Dismiss</button></div>
  </aside>;
}
