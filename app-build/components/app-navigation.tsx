"use client";

import { useEffect, useRef, useState } from "react";
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
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mobileMoreTrigger = useRef<HTMLButtonElement>(null);
  const mobileMoreClose = useRef<HTMLButtonElement>(null);
  const mobileMoreSheet = useRef<HTMLElement>(null);

  useEffect(() => setMobileMoreOpen(false), [pathname]);

  useEffect(() => {
    if (!mobileMoreOpen) return;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => mobileMoreClose.current?.focus(), 0);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMoreOpen(false);
        window.setTimeout(() => mobileMoreTrigger.current?.focus(), 0);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...(mobileMoreSheet.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])') ?? [])];
      if (!controls.length) return;
      const first = controls[0], last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = priorOverflow;
    };
  }, [mobileMoreOpen]);

  const publicPaths = ["/manifesto", "/constitution", "/industry", "/login", "/recover", "/reset-password", "/privacy", "/terms", "/beta-agreement", "/partners/join", "/partners/invite", "/r"];
  if (publicPaths.some((path) => matches(pathname, path))) return <header className="publicHeader"><div className="publicHeaderInner">
    <Link className="appBrand" href="/" aria-label={`${brand.spokenName} home`}>{!brand.isPreview&&<HojaviaMark/>}<span><strong>{brand.name}<span className="brandPronunciation">({brand.pronunciation})</span></strong><small>{brand.brandLine}</small></span></Link>
    <nav aria-label="Public navigation"><Link href="/industry" className={matches(pathname,"/industry")?"active":undefined}>Industry Hub</Link><Link href="/manifesto" className={matches(pathname,"/manifesto")?"active":undefined}>Manifesto</Link><Link href="/constitution" className={matches(pathname,"/constitution")?"active":undefined}>Constitution</Link><Link href="/login" className="button secondary">Sign in</Link></nav>
  </div></header>;
  const moreLinks=[
    ["/records","Review","Learn from your own experience and trusted voices"],
    ["/valuations","Market","Understand value through dated evidence"],
    ["/verification","Verify","Protect authenticity and provenance"],
    ["/collector-walkthrough","Walkthrough","Practice the complete evidence journey with a safe example"],
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
  const mobileFeaturedLinks=[
    ["/community","Collectors’ Lounge","Connect with collectors and trusted places","◎"],
    ["/cigar-somm","Cigar Somm","Explore collection-aware guidance","◒"],
    ["/learn","Learn","Build knowledge through sourced education","◇"],
    ["/notifications","Inbox","Review updates and collection signals","○"],
    ["/account","Account","Manage your profile, privacy, and preferences","·"],
  ] as const;
  const mobileMoreActive=moreActive||mobileFeaturedLinks.some(([href])=>matches(pathname,href));
  const closeMobileMore = (restoreFocus = false) => {
    setMobileMoreOpen(false);
    if (restoreFocus) window.setTimeout(() => mobileMoreTrigger.current?.focus(), 0);
  };
  const openMobileSearch = () => {
    closeMobileMore();
    window.setTimeout(() => window.dispatchEvent(new Event("hojavia:open-search")), 0);
  };
  return <><header className="appHeader"><div className="appHeaderInner">
    <Link className="appBrand" href="/" aria-label={`${brand.spokenName} home`}>{!brand.isPreview&&<HojaviaMark/>}<span><strong>{brand.name}<span className="brandPronunciation">({brand.pronunciation})</span></strong><small>{brand.brandLine}</small></span></Link>
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
  </div></header>
  <nav className="mobileNav" aria-label="Mobile navigation">
    <Link href="/" className={pathname==="/"?"active":undefined} aria-current={pathname==="/"?"page":undefined}><span>⌂</span><small>Home</small></Link>
    <Link href="/discover" className={matches(pathname,"/discover")||matches(pathname,"/catalog")?"active":undefined} aria-current={matches(pathname,"/discover")||matches(pathname,"/catalog")?"page":undefined}><span>◇</span><small>Discover</small></Link>
    <Link href="/inventory#mobile-intake" className="mobileAdd"><span>＋</span><small>Document</small></Link>
    <Link href="/inventory" className={matches(pathname,"/inventory")||matches(pathname,"/collections")||matches(pathname,"/humidors")?"active":undefined} aria-current={matches(pathname,"/inventory")||matches(pathname,"/collections")||matches(pathname,"/humidors")?"page":undefined}><span>▦</span><small>Vault</small></Link>
    <button ref={mobileMoreTrigger} type="button" className={mobileMoreActive?"active":undefined} aria-haspopup="dialog" aria-expanded={mobileMoreOpen} aria-controls="mobile-more-sheet" onClick={()=>setMobileMoreOpen(true)}><span>•••</span><small>More</small></button>
  </nav>
  {mobileMoreOpen&&<div className="mobileMoreOverlay" onMouseDown={(event)=>{if(event.currentTarget===event.target)closeMobileMore(true)}}>
    <section ref={mobileMoreSheet} id="mobile-more-sheet" className="mobileMoreSheet" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title" aria-describedby="mobile-more-description">
      <header><div><span>Navigate</span><h2 id="mobile-more-title">More of {brand.name}</h2><small id="mobile-more-description">Search or choose any collector workspace.</small></div><button ref={mobileMoreClose} type="button" onClick={()=>closeMobileMore(true)} aria-label="Close More menu">×</button></header>
      <button type="button" className="mobileMoreSearch" onClick={openMobileSearch}><span aria-hidden="true">⌕</span><strong>Search {brand.name}</strong><small>Find cigars, collections, markets, or tools</small></button>
      <div className="mobileMoreFeatured" aria-label="Popular destinations">{mobileFeaturedLinks.map(([href,label,description,icon])=>{const active=matches(pathname,href);return <Link href={href} className={active?"active":undefined} aria-current={active?"page":undefined} key={href}><span aria-hidden="true">{icon}</span><div><strong>{label}</strong><small>{description}</small></div><b aria-hidden="true">›</b></Link>})}</div>
      <div className="mobileMoreDirectory"><h3>All areas</h3>{moreLinks.map(([href,label,description])=>{const active=matches(pathname,href);return <Link href={href} className={active?"active":undefined} aria-current={active?"page":undefined} key={href}><div><strong>{label}</strong><small>{description}</small></div><b aria-hidden="true">›</b></Link>})}</div>
    </section>
  </div>}
  </>;
}
