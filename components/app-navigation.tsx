"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { GlobalSearch } from "@/components/global-search";
import { CedrivaMark } from "@/components/cedriva-mark";

function matches(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();
  const publicPaths = ["/manifesto", "/constitution", "/login", "/recover", "/reset-password"];
  if (publicPaths.some((path) => matches(pathname, path))) return <header className="publicHeader"><div className="publicHeaderInner">
    <Link className="appBrand" href="/" aria-label="Cedriva home"><CedrivaMark/><span><strong>Cedriva</strong><small>Preserve · Honor · Grow</small></span></Link>
    <nav aria-label="Public navigation"><Link href="/manifesto" className={matches(pathname,"/manifesto")?"active":undefined}>Manifesto</Link><Link href="/constitution" className={matches(pathname,"/constitution")?"active":undefined}>Constitution</Link><Link href="/login" className="button secondary">Sign in</Link></nav>
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
    <Link className="appBrand" href="/" aria-label="Cedriva home"><CedrivaMark/><span><strong>Cedriva</strong><small>Premium cigar culture</small></span></Link>
    <GlobalSearch/><nav className="appNav" aria-label="Primary navigation">
      <Link href="/" className={pathname === "/" ? "active" : undefined} aria-current={pathname === "/" ? "page" : undefined}>Home</Link>
      <Link href="/discover" className={matches(pathname,"/discover")||matches(pathname,"/catalog")?"active":undefined}>Discover</Link>
      <Link href="/inventory" className={matches(pathname,"/inventory")||matches(pathname,"/collections")||matches(pathname,"/humidors")?"active":undefined}>Vault</Link>
      <Link href="/learn" className={matches(pathname,"/learn")||matches(pathname,"/sommelier-library")||matches(pathname,"/data-model")?"active":undefined}>Learn</Link>
      <Link href="/community" className={matches(pathname,"/community")?"active":undefined}>Community</Link>
      <Link href="/cigar-somm" className={matches(pathname,"/cigar-somm")||matches(pathname,"/intelligence")?"active":undefined}>Cedriva AI</Link>
      <details className={`navGroup ${moreActive?"active":""}`}><summary>More<span aria-hidden="true">⌄</span></summary><div className="navMenu">{moreLinks.map(([href,label,description])=><Link href={href} className={matches(pathname,href)?"active":undefined} key={href}><strong>{label}</strong><small>{description}</small></Link>)}</div></details>
      <Link href="/notifications" className={matches(pathname, "/notifications") ? "active" : undefined}>Inbox</Link>
      <Link href="/account" className={matches(pathname, "/account") ? "active" : undefined}>Account</Link>
    </nav>
  </div></header><nav className="mobileNav" aria-label="Mobile navigation"><Link href="/" className={pathname==="/"?"active":undefined}><span>⌂</span><small>Home</small></Link><Link href="/discover" className={matches(pathname,"/discover")?"active":undefined}><span>◇</span><small>Discover</small></Link><Link href="/inventory#mobile-intake" className="mobileAdd"><span>＋</span><small>Document</small></Link><Link href="/inventory" className={matches(pathname,"/inventory")||matches(pathname,"/collections")?"active":undefined}><span>▦</span><small>Vault</small></Link><Link href="/explore" className={matches(pathname,"/explore")||matches(pathname,"/learn")?"active":undefined}><span>•••</span><small>Explore</small></Link></nav></>;
}
