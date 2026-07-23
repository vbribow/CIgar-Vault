import { loadCollections,loadValuations,loadWishlist } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { buildAcquisitionPlan } from "@/lib/acquisition-planner";
import { WishlistManager } from "@/components/wishlist-manager";
import { WishlistAvailabilityBoard } from "@/components/wishlist-availability-board";
import { WishlistPurchaseIntake } from "@/components/wishlist-purchase-intake";
import "./wishlist.css";
import "./availability.css";
import "./purchase.css";
import "./price-alerts.css";
import { WorkspaceGuide } from "@/components/workspace-guide";
export const dynamic="force-dynamic";
export default async function WishlistPage(){const[collections,inventory,valuations,wishlist]=await Promise.all([loadCollections(),loadInventory(),loadValuations(),loadWishlist()]);const targets=buildAcquisitionPlan(collections,inventory,valuations);return <main className="shell wishlistPage"><section className="wishlistHero"><div><div className="eyebrow">Collector buying plan</div><h1>Watch deliberately. Buy intelligently.</h1><p>Track missing collection pieces and personal targets without changing inventory. Purchased cigars remain here until you explicitly approve them into the vault.</p></div></section><WorkspaceGuide items={[{label:"Watch",title:"Define the exact target",detail:"Record brand, line, vitola, priority, and an optional per-cigar target price."},{label:"Research",title:"Compare direct market leads",detail:"Availability is time-sensitive evidence, not guaranteed stock."},{label:"Convert",title:"Approve purchases into inventory",detail:"Nothing changes owned quantities until you confirm the purchase details."}]}/><WishlistManager initialItems={wishlist} targets={targets}/><WishlistPurchaseIntake items={wishlist}/><WishlistAvailabilityBoard items={wishlist}/></main>}
