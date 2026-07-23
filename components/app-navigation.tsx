"use client";

import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/global-search";
import { CedrivaMark } from "@/components/cedriva-mark";

function matches(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();
  const publicPaths = ["/manifesto", "/constitution", "/login", "/recover", "/reset-password"];
  if (publicPaths.some((path) => matches(pathname, path))) return <header className="publicHeader"><div className="publicHeaderInner">
    <a className="appBrand" href="/" aria-label="Cedriva home"><CedrivaMark/><span><strong>Cedriva</strong><small>Preserve · Honor · Grow</small></span></a>
    <nav aria-label="Public navigation"><a href="/manifesto" className={matches(pathname,"/manifesto")?"active":undefined}>Manifesto</a><a href="/constitution" className={matches(pathname,"/constitution")?"active":undefined}>Constitution</a><a href="/login" className="button secondary">Sign in</a></nav>
  </div></header>;
  const moreLinks=[
    ["/records","Review","Learn from your own experience and trusted voices"],
    ["/valuations","Market","Understand value through dated evidence"],
    ["/verification","Verify","Protect authenticity and provenance"],
    ["/pricing","Reserve","Explore deeper intelligence and service"],
    ["/explore","All of Cedriva","See every connected collector experience"],
  ] as const;
  const moreActive=moreLinks.some(([href])=>matches(pathname,href));
  return <><header className="appHeader"><div className="appHeaderInner">
    <a className="appBrand" href="/" aria-label="Cedriva home"><CedrivaMark/><span><strong>Cedriva</strong><small>Premium cigar culture</small></span></a>
    <GlobalSearch/><nav className="appNav" aria-label="Primary navigation">
      <a href="/" className={pathname === "/" ? "active" : undefined} aria-current={pathname === "/" ? "page" : undefined}>Home</a>
      <a href="/discover" className={matches(pathname,"/discover")||matches(pathname,"/catalog")?"active":undefined}>Discover</a>
      <a href="/inventory" className={matches(pathname,"/inventory")||matches(pathname,"/collections")||matches(pathname,"/humidors")?"active":undefined}>Vault</a>
      <a href="/learn" className={matches(pathname,"/learn")||matches(pathname,"/sommelier-library")?"active":undefined}>Learn</a>
      <a href="/community" className={matches(pathname,"/community")?"active":undefined}>Community</a>
      <a href="/cigar-somm" className={matches(pathname,"/cigar-somm")||matches(pathname,"/intelligence")?"active":undefined}>Cedriva AI</a>
      <details className={`navGroup ${moreActive?"active":""}`}><summary>More<span aria-hidden="true">⌄</span></summary><div className="navMenu">{moreLinks.map(([href,label,description])=><a href={href} className={matches(pathname,href)?"active":undefined} key={href}><strong>{label}</strong><small>{description}</small></a>)}</div></details>
      <a href="/notifications" className={matches(pathname, "/notifications") ? "active" : undefined}>Inbox</a>
      <a href="/account" className={matches(pathname, "/account") ? "active" : undefined}>Account</a>
    </nav>
  </div></header><nav className="mobileNav" aria-label="Mobile navigation"><a href="/" className={pathname==="/"?"active":undefined}><span>⌂</span><small>Home</small></a><a href="/discover" className={matches(pathname,"/discover")?"active":undefined}><span>◇</span><small>Discover</small></a><a href="/inventory#mobile-intake" className="mobileAdd"><span>＋</span><small>Document</small></a><a href="/inventory" className={matches(pathname,"/inventory")||matches(pathname,"/collections")?"active":undefined}><span>▦</span><small>Vault</small></a><a href="/explore" className={matches(pathname,"/explore")||matches(pathname,"/learn")?"active":undefined}><span>•••</span><small>Explore</small></a></nav></>;
}
