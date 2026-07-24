import { CommunityHub } from "@/components/community-hub";
import "./community.css";
import { WorkspaceGuide } from "@/components/workspace-guide";
import { loadInventory } from "@/lib/inventory";
import { communityRatingInventoryOptions } from "@/lib/community-rating-options";
import type { Metadata } from "next";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Community",description:"Learn from collectors, share experience generously, and help premium cigar culture grow."};
export default async function CommunityPage({searchParams}:{searchParams:Promise<{tab?:string}>}){const[{tab},inventory]=await Promise.all([searchParams,loadInventory()]);const inventoryOptions=communityRatingInventoryOptions(inventory);return <main className="shell wideShell communityPage"><section className="communityHero"><div><div className="eyebrow">Cedriva Community</div><h1>The collector’s table.</h1><p className="lede">Compare experiences, care for exceptional collections, and shape a living Top 25 based on member ratings—not retailer promotion.</p></div><aside><strong>21+</strong><span>Collector education and discussion</span><small>No marketplace transactions</small></aside></section><WorkspaceGuide items={[{label:"Rate",title:"Score cigars you have experienced",detail:"Choose directly from your Vault, or enter a cigar that is not yet documented."},{label:"Discover",title:"Follow the community Top 25",detail:"Average score leads; rating volume provides context and credibility."},{label:"Discuss",title:"Share knowledge responsibly",detail:"Education and collection care only—transactions and contact solicitation are prohibited."}]}/><CommunityHub inventoryOptions={inventoryOptions} initialTab={tab==="ratings"?"ratings":"board"}/></main>}
