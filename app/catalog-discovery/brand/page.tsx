import { notFound } from "next/navigation";
import { BrandResearchWorkspace } from "@/components/brand-research-workspace";
import { brandResearchBacklog } from "@/lib/brand-research";
import "./brand-research.css";

export const dynamic = "force-dynamic";

export default async function BrandResearchPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const { name } = await searchParams;
  const item = brandResearchBacklog().find((candidate) => candidate.brand.toLocaleLowerCase() === String(name || "").toLocaleLowerCase());
  if (!item) notFound();
  return <main className="shell brandResearchPage">
    <nav className="nav"><a className="brand" href="/">Cedriva</a><div className="navLinks"><a href="/catalog-discovery#research-backlog">Evidence backlog</a><a href="/learn/manufacturing-truth#research-standard">Evidence standard</a><span className="badge">Founder research</span></div></nav>
    <section className="brandResearchHero">
      <div><div className="eyebrow">Cedriva Brand Research · {item.priority}</div><h1>{item.brand}</h1><p>{item.primaryRegion} · {item.segment}</p><span>{item.status}</span></div>
      <aside><strong>{item.missing.length}</strong><span>open evidence fields</span><small>Unknown remains visible until the source supports it.</small></aside>
    </section>
    <BrandResearchWorkspace item={item} />
  </main>;
}
