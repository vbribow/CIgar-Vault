"use client";

import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/global-search";

const groups = [
  {
    label: "Inventory",
    links: [
      ["/inventory", "All inventory", "Search and manage every owned lot"],
      ["/inventory-count", "Physical count", "Reconcile boxes and loose cigars"],
      ["/activity", "Activity ledger", "Record purchases, smokes, moves, and corrections"],
      ["/storage", "Storage map", "See where every cigar lives"],
      ["/catalog", "Cigar catalog", "Canonical brands, lines, and vitolas"],
      ["/catalog-discovery", "Catalog discovery", "Review newly researched cigars"],
      ["/box-formats", "Box formats", "Sourced packaging and box-size intelligence"],
      ["/collection-health", "Record quality", "Find incomplete inventory data"],
      ["/verification", "Habanos verification", "Preserve box-code and seal evidence"],
      ["/inventory-integrity", "Integrity center", "Compare, back up, and restore inventory"],
      ["/system-health", "System health", "Check integrations and automation runs"],
      ["/founder-insights", "Founder insights", "Measure private launch activation"],
      ["/founder-onboarding", "Beta onboarding", "Track the first 25 collectors"],
    ],
  },
  {
    label: "Collections",
    links: [
      ["/collections", "My collections", "Value collectible sets as a whole"],
      ["/collection-catalog", "Collection catalog", "Browse researched heritage sets"],
      ["/acquisitions", "Acquisition planner", "Find missing collection components"],
      ["/decision-center", "Decision center", "Set goals, evaluate purchases, and compare market channels"],
      ["/wishlist", "Wishlist", "Monitor targets, pricing, and availability"],
    ],
  },
  {
    label: "Value & reports",
    links: [
      ["/intelligence", "Collection intelligence", "Health score, Collector DNA, and vault priorities"],
      ["/cigar-somm", "Cigar Somm", "Questions plus coffee, spirit, cocktail, and nonalcoholic pairings"],
      ["/valuations", "Valuations", "Research unit and market values"],
      ["/auction-market", "Auction market", "Verified completed sales and source connections"],
      ["/ratings", "Professional ratings", "Research published review scores"],
      ["/value-history", "Portfolio history", "Track collection value over time"],
      ["/reports", "Insurance report", "Create an evidence-backed property schedule"],
      ["/records", "Smoking journal", "Record tastings and valuation evidence"],
    ],
  },
  {
    label: "Climate",
    links: [
      ["/humidors", "Humidors", "Set targets and monitor stored value"],
      ["/sensors", "Sensors", "Connect and normalize climate readings"],
      ["/alerts", "Climate alerts", "Review warnings and delivery history"],
    ],
  },
  {
    label: "Community",
    links: [
      ["/constitution", "Our constitution", "The purpose and principles governing Cedriva"],
      ["/community", "Collector community", "Message board and member-rated Top 25"],
      ["/ai-administrator", "AI Administrator", "Founder moderation and community operations"],
    ],
  },
] as const;

function matches(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();
  return <><header className="appHeader"><div className="appHeaderInner">
    <a className="appBrand" href="/" aria-label="Cedriva dashboard"><span className="appBrandMark">C</span><span><strong>Cedriva</strong><small>Premium cigar culture</small></span></a>
    <GlobalSearch/><nav className="appNav" aria-label="Primary navigation">
      <a href="/" className={pathname === "/" ? "active" : undefined} aria-current={pathname === "/" ? "page" : undefined}>Dashboard</a>
      {groups.map(group => {
        const active = group.links.some(([href]) => matches(pathname, href));
        return <details className={`navGroup ${active ? "active" : ""}`} key={group.label}><summary>{group.label}<span aria-hidden="true">⌄</span></summary><div className="navMenu">{group.links.map(([href, label, description]) => <a href={href} className={matches(pathname, href) ? "active" : undefined} aria-current={matches(pathname, href) ? "page" : undefined} key={href}><strong>{label}</strong><small>{description}</small></a>)}</div></details>;
      })}
      <a href="/notifications" className={matches(pathname, "/notifications") ? "active" : undefined}>Inbox</a>
      <a href="/pricing" className={matches(pathname, "/pricing") ? "active" : undefined}>Plans</a>
      <a href="/account" className={matches(pathname, "/account") ? "active" : undefined}>Account</a>
    </nav>
  </div></header><nav className="mobileNav" aria-label="Mobile navigation"><a href="/" className={pathname==="/"?"active":undefined}><span>⌂</span><small>Home</small></a><a href="/inventory" className={matches(pathname,"/inventory")?"active":undefined}><span>▦</span><small>Vault</small></a><a href="/inventory#mobile-intake" className="mobileAdd"><span>＋</span><small>Add</small></a><a href="/collections" className={matches(pathname,"/collections")?"active":undefined}><span>◫</span><small>Collections</small></a><a href="/community" className={matches(pathname,"/community")?"active":undefined}><span>◎</span><small>Community</small></a></nav></>;
}
