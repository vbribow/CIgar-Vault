"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { GlobalSearch } from "@/components/global-search";
import { HojaviaMark } from "@/components/hojavia-mark";
import { brand } from "@/lib/brand";

function matches(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();
  const publicPaths = ["/manifesto", "/constitution", "/industry", "/login", "/recover", "/reset-password", "/privacy", "/terms", "/beta-agreement", "/partners/join", "/partners/invite", "/r"];
  if (publicPaths.some((path) => matches(pathname, path))) return <header className="publicHeader"><div className="publicHeaderInner">
    <Link className="appBrand" href="/" aria-label={`${brand.spokenName} home`}>{!brand.isPreview&&<HojaviaMark/>}<span><strong>{brand.name}<span className="brandPronunciation">({brand.pronunciation})</span></strong><small>{brand.brandLine}</small></span></Link>
    <nav aria-label="Public navigation"><Link href="/industry" className={matches(pathname,"/industry")?"active":undefined}>Industry Hub</Link><Link href="/manifesto" className={matches(pathname,"/manifesto")?"active":undefined}>Manifesto</Link><Link href="/constitution" className={matches(pathname,"/constitution")?"active":undefined}>Constitution</Link><Link href="/login" className="button secondary">Sign in</Link></nav>
  </div></header>;
  const moreLinks=[
    ["/records","Review","Learn from your own experience and trusted voices"],
    ["/valuations","Market","Understand value through dated evidence"],
    ["/verification","Verify","Protect authenticity and provenance"],
    ["/collector-walkthrough","Walkthrough","Try the complete evidence journey with synthetic data"],
    ["/trust","Trust Center",`Understand every ${brand.name} source label`],
    ["/trust-scorecard","Trust Scorecard","Measure verified coverage and visible research gaps"],
    ["/industry","Industry Hub","Official profiles, releases, and alerts from verified organizations"],
    ["/industry/registry","Product Registry","Official products, releases, packaging, and canonical records"],
    ["/provenance-graph","Provenance Graph","See how every cigar connects to people, place, time, and evidence"],
    ["/briefing","Daily Briefing","Review proactive collection and industry intelligence"],
    ["/places","Cigar Places","Find lounges, cigar bars, and retailers with transparent ratings"],
    ["/partner-platform","Partner Network","Manage attribution, commissions, and industry relationships"],
    ["/affiliate-readiness","Affiliate Readiness","Review compensation safeguards without activating a program"],
    ["/launch-readiness","Launch Readiness","Track the baseline, active gates, and deferred decisions"],
    ["/partner-workspace","Partner Workspace","Collaborate inside your organization’s private workspace"],
    ["/feedback","Beta Feedback","Report bugs, confusion, trust concerns, and ideas"],
    ["/pricing","Reserve","Explore deeper intelligence and service"],
    ["/explore",`All of ${brand.name}`,"See every connected collector experience"],
  ] as const;
  const moreActive=moreLinks.some(([href])=>matches(pathname,href));
  return <><header className="appHeader"><div className="appHeaderInner">
    <Link className="appBrand" href="/" aria-label={`${brand.spokenName} home`}>{!brand.isPreview&&<HojaviaMark/>}<span><strong>{brand.name}<span className="brandPronunciation">({brand.pronunciation})</span></strong><small>{brand.communityLine}</small></span></Link>
    <GlobalSearch/><nav className="appNav" aria-label="Primary navigation">
      <Link href="/" className={pathname === "/" ? "active" : undefined} aria-current={pathname === "/" ? "page" : undefined}>Home</Link>
      <Link href="/discover" className={matches(pathname,"/discover")||matches(pathname,"/catalog")?"active":undefined}>Discover</Link>
      <Link href="/inventory" className={matches(pathname,"/inventory")||matches(pathname,"/collections")||matches(pathname,"/humidors")?"active":undefined}>Vault</Link>
      <Link href="/learn" className={matches(pathname,"/learn")||matches(pathname,"/sommelier-library")||matches(pathname,"/data-model")?"active":undefined}>Learn</Link>
      <Link href="/community" className={matches(pathname,"/community")||matches(pathname,"/places")?"active":undefined}>Collectors’ Lounge</Link>
      <Link href="/cigar-somm" className={matches(pathname,"/cigar-somm")||matches(pathname,"/intelligence")?"active":undefined}>Cigar Somm</Link>
      <details className={`navGroup ${moreActive?"active":""}`}><summary>More<span aria-hidden="true">⌄</span></summary><div className="navMenu">{moreLinks.map(([href,label,description])=><Link href={href} className={matches(pathname,href)?"active":undefined} key={href}><strong>{label}</strong><small>{description}</small></Link>)}</div></details>
      <Link href="/notifications" className={matches(pathname, "/notifications") ? "active" : undefined}>Inbox</Link>
      <Link href="/account" className={matches(pathname, "/account") ? "active" : undefined}>Account</Link>
    </nav>
  </div></header><nav className="mobileNav" aria-label="Mobile navigation" style={{gridTemplateColumns:"repeat(6, minmax(0, 1fr))"}}><Link href="/" className={pathname==="/"?"active":undefined} aria-current={pathname==="/"?"page":undefined}><span>⌂</span><small>Home</small></Link><Link href="/discover" className={matches(pathname,"/discover")||matches(pathname,"/catalog")?"active":undefined} aria-current={matches(pathname,"/discover")||matches(pathname,"/catalog")?"page":undefined}><span>◇</span><small>Discover</small></Link><Link href="/community" className={matches(pathname,"/community")||matches(pathname,"/places")?"active":undefined} aria-current={matches(pathname,"/community")||matches(pathname,"/places")?"page":undefined} aria-label="Collectors’ Lounge"><span>◎</span><small>Lounge</small></Link><Link href="/inventory#mobile-intake" className="mobileAdd"><span>＋</span><small>Document</small></Link><Link href="/inventory" className={matches(pathname,"/inventory")||matches(pathname,"/collections")?"active":undefined} aria-current={matches(pathname,"/inventory")||matches(pathname,"/collections")?"page":undefined}><span>▦</span><small>Vault</small></Link><Link href="/cigar-somm" className={matches(pathname,"/cigar-somm")?"active":undefined} aria-current={matches(pathname,"/cigar-somm")?"page":undefined}><span>◒</span><small>Somm</small></Link></nav></>;
}
