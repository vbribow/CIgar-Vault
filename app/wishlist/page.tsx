import { loadCollections,loadValuations,loadWishlist } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { buildAcquisitionPlan } from "@/lib/acquisition-planner";
import { WishlistManager } from "@/components/wishlist-manager";
import { WishlistAvailabilityBoard } from "@/components/wishlist-availability-board";
import "./wishlist.css";
import "./availability.css";
export const dynamic="force-dynamic";
export default async function WishlistPage(){const[collections,inventory,valuations,wishlist]=await Promise.all([loadCollections(),loadInventory(),loadValuations(),loadWishlist()]);const targets=buildAcquisitionPlan(collections,inventory,valuations);return <main className="shell wishlistPage"><nav className="nav"><a className="brand" href="/">Cigar Vault</a><div className="navLinks"><a href="/acquisitions">Acquisition planner</a><span className="badge">Wishlist</span></div></nav><section className="wishlistHero"><div><div className="eyebrow">Collector buying plan</div><h1>Watch deliberately. Buy intelligently.</h1><p>Track missing collection pieces and personal targets without changing inventory. Purchased cigars remain here until you explicitly add them to the vault.</p></div></section><WishlistManager initialItems={wishlist} targets={targets}/><WishlistAvailabilityBoard items={wishlist}/></main>}
