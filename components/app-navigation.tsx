"use client";

import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/global-search";
import { CedrivaMark } from "@/components/cedriva-mark";
import { productDomains } from "@/lib/product-domains";

function matches(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();
  return <><header className="appHeader"><div className="appHeaderInner">
    <a className="appBrand" href="/" aria-label="Cedriva dashboard"><CedrivaMark/><span><strong>Cedriva</strong><small>Premium cigar culture</small></span></a>
    <GlobalSearch/><nav className="appNav" aria-label="Primary navigation">
      <a href="/" className={pathname === "/" ? "active" : undefined} aria-current={pathname === "/" ? "page" : undefined}>Home</a>
      {productDomains.map(domain => {
        const active = domain.links.some(link => matches(pathname, link.href));
        return <details className={`navGroup ${active ? "active" : ""}`} key={domain.id}><summary>{domain.label}<span aria-hidden="true">⌄</span></summary><div className="navMenu"><div className="navDomainPromise">{domain.promise}</div>{domain.links.map(link => <a href={link.href} className={matches(pathname, link.href) ? "active" : undefined} aria-current={matches(pathname, link.href) ? "page" : undefined} key={link.href}><strong>{link.label}</strong><small>{link.description}</small></a>)}</div></details>;
      })}
      <a href="/notifications" className={matches(pathname, "/notifications") ? "active" : undefined}>Inbox</a>
      <a href="/account" className={matches(pathname, "/account") ? "active" : undefined}>Account</a>
    </nav>
  </div></header><nav className="mobileNav" aria-label="Mobile navigation"><a href="/" className={pathname==="/"?"active":undefined}><span>⌂</span><small>Home</small></a><a href="/discover" className={matches(pathname,"/discover")?"active":undefined}><span>◇</span><small>Discover</small></a><a href="/inventory#mobile-intake" className="mobileAdd"><span>＋</span><small>Document</small></a><a href="/inventory" className={matches(pathname,"/inventory")||matches(pathname,"/collections")?"active":undefined}><span>▦</span><small>Vault</small></a><a href="/explore" className={matches(pathname,"/explore")||matches(pathname,"/learn")?"active":undefined}><span>•••</span><small>Explore</small></a></nav></>;
}
