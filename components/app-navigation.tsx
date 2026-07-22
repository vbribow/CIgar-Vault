"use client";

import { usePathname } from "next/navigation";

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
      ["/wishlist", "Wishlist", "Monitor targets, pricing, and availability"],
    ],
  },
  {
    label: "Value & reports",
    links: [
      ["/valuations", "Valuations", "Research unit and market values"],
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
] as const;

function matches(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();
  return <header className="appHeader"><div className="appHeaderInner">
    <a className="appBrand" href="/" aria-label="Cigar Vault dashboard"><span className="appBrandMark">CV</span><span><strong>Cigar Vault</strong><small>Collection intelligence</small></span></a>
    <nav className="appNav" aria-label="Primary navigation">
      <a href="/" className={pathname === "/" ? "active" : undefined} aria-current={pathname === "/" ? "page" : undefined}>Dashboard</a>
      {groups.map(group => {
        const active = group.links.some(([href]) => matches(pathname, href));
        return <details className={`navGroup ${active ? "active" : ""}`} key={group.label}><summary>{group.label}<span aria-hidden="true">⌄</span></summary><div className="navMenu">{group.links.map(([href, label, description]) => <a href={href} className={matches(pathname, href) ? "active" : undefined} aria-current={matches(pathname, href) ? "page" : undefined} key={href}><strong>{label}</strong><small>{description}</small></a>)}</div></details>;
      })}
      <a href="/notifications" className={matches(pathname, "/notifications") ? "active" : undefined}>Inbox</a>
      <a href="/pricing" className={matches(pathname, "/pricing") ? "active" : undefined}>Plans</a>
      <a href="/account" className={matches(pathname, "/account") ? "active" : undefined}>Account</a>
    </nav>
  </div></header>;
}
