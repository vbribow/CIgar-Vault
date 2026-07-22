import { CommunityHub } from "@/components/community-hub";
import "./community.css";
export const dynamic="force-dynamic";
export default function CommunityPage(){return <main className="shell wideShell communityPage"><section className="communityHero"><div><div className="eyebrow">Cigar Vault Community</div><h1>The collector’s table.</h1><p className="lede">Compare experiences, care for exceptional collections, and shape a living Top 25 based on verified member ratings—not retailer promotion.</p></div><aside><strong>21+</strong><span>Collector education and discussion</span><small>No marketplace transactions</small></aside></section><CommunityHub/></main>}
