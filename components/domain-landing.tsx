import type { ProductDomainId } from "@/lib/product-domains";
import { productDomain } from "@/lib/product-domains";

export function DomainLanding({domainId,eyebrow,introduction}:{domainId:ProductDomainId;eyebrow:string;introduction:string}){
  const domain=productDomain(domainId);
  return <main className="shell domainLanding"><section className="domainHero"><div><div className="eyebrow">{eyebrow}</div><h1>{domain.label}</h1><p className="lede">{domain.promise}</p><p>{introduction}</p></div><aside><span>Begin here</span><strong>{domain.links[1]?.label||domain.links[0].label}</strong><a className="button" href={domain.links[1]?.href||domain.links[0].href}>Continue →</a></aside></section><section className="domainLinkGrid">{domain.links.map((link,index)=><a href={link.href} key={link.href}><span>{String(index+1).padStart(2,"0")}</span><h2>{link.label}</h2><p>{link.description}</p><b>Open →</b></a>)}</section><section className="domainStandard"><div className="eyebrow">How Cedriva works</div><h2>Purpose before tools.</h2><p>Each destination answers one collector question, explains why it matters, and preserves the evidence behind what Cedriva knows.</p></section></main>
}
