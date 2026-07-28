import { productDomains } from "@/lib/product-domains";
import type { Metadata } from "next";
import { brand } from "@/lib/brand";
export const metadata:Metadata={title:`Explore ${brand.name}`,description:"Explore nine connected collector experiences built around discovery, stewardship, knowledge, trust, and community."};
export default function ExploreHojaviaPage(){return <main className="shell domainLanding"><section className="domainHero"><div><div className="eyebrow">One connected {brand.name}</div><h1>Choose what you want to do.</h1><p className="lede">Begin with a collector purpose—not a software tool. Every area works from the same private collection and trusted knowledge.</p></div></section><section className="domainDirectory">{productDomains.map((domain,index)=><a href={domain.href} key={domain.id}><span>{String(index+1).padStart(2,"0")}</span><div><h2>{domain.label}</h2><p>{domain.promise}</p></div><b>Explore →</b></a>)}</section></main>}
