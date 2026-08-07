import { notFound } from "next/navigation";
import { loadInventory } from "@/lib/inventory";
import { RetailerMarket } from "@/components/retailer-market";
import { brand } from "@/lib/brand";
export const dynamic="force-dynamic";
export default async function AvailabilityPage({params}:{params:Promise<{inventoryId:string}>}){const{inventoryId}=await params;const item=(await loadInventory()).find(record=>record.inventoryId===inventoryId);if(!item)notFound();return <main className="shell"><nav className="nav"><a className="brand" href="/">{brand.name}</a><a className="backLink" href={`/inventory/${encodeURIComponent(item.inventoryId)}`}>← Cigar record</a></nav><section className="detailHero"><div><div className="eyebrow">Retailer market · exact identity</div><h1>{item.brand}</h1><p>{item.line}</p><span>{item.vitola}{item.vintage?` · ${item.vintage}`:""}</span></div><div className="scoreCard"><small>Known retail replacement</small><strong>{item.retailValue===undefined?"—":`$${item.retailValue.toLocaleString()}`}</strong><span>Per cigar · not resale value</span></div></section><RetailerMarket item={item}/></main>}
