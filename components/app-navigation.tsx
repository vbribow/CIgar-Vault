"use client";

import { usePathname } from "next/navigation";

const sections = [
  { href: "/", label: "Dashboard" },
  { href: "/inventory", label: "Inventory", related: ["/catalog", "/box-formats", "/inventory-count", "/storage", "/collection-health", "/verification"] },
  { href: "/collections", label: "Collections", related: ["/collection-catalog"] },
  { href: "/valuations", label: "Valuations", related: ["/records"] },
  { href: "/humidors", label: "Humidors" },
  { href: "/sensors", label: "Sensors" },
  { href: "/activity", label: "Activity" },
];

function matches(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <header className="appHeader">
      <div className="appHeaderInner">
        <a className="appBrand" href="/" aria-label="Cigar Vault dashboard">
          <span className="appBrandMark">CV</span>
          <span><strong>Cigar Vault</strong><small>Collector intelligence</small></span>
        </a>
        <nav className="appNav" aria-label="Primary navigation">
          {sections.map(section => {
            const active = matches(pathname, section.href) || section.related?.some(href => matches(pathname, href));
            return <a href={section.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined} key={section.href}>{section.label}</a>;
          })}
        </nav>
      </div>
    </header>
  );
}
