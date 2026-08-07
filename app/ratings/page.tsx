import { RatingResearchPanel } from "@/components/rating-research-panel";
import { UpgradeNudge } from "@/components/upgrade-nudge";
import { cigarInventoryRecords } from "@/lib/collection-presentation";
import { loadCollections, loadRatingDrafts, loadRatings } from "@/lib/data";
import { loadAccountPlan } from "@/lib/entitlements-server";
import { loadInventory } from "@/lib/inventory";
import { accountDataMode } from "@/lib/user-data";
import { prioritizeRatingInventory } from "@/lib/cigar-ratings";
import "./ratings.css";

export const dynamic = "force-dynamic";

export default async function RatingsPage({searchParams}:{searchParams:Promise<{inventoryId?:string}>}) {
  const {inventoryId}=await searchParams;
  const mode = await accountDataMode();
  const [allInventory, collections, ratings, drafts, plan] = await Promise.all([
    loadInventory(), loadCollections(),
    mode === "mock" ? Promise.resolve([]) : loadRatings(),
    mode === "mock" ? Promise.resolve([]) : loadRatingDrafts(),
    loadAccountPlan(),
  ]);
  const inventory = cigarInventoryRecords(allInventory, collections);
  const rated = new Set(ratings.map((rating) => rating.inventoryId));
  const pending = new Set(drafts.filter((draft) => draft.ratings.length).map((draft) => draft.inventoryId));
  const prioritized = [...inventory].sort((a, b) =>
    Number(pending.has(b.inventoryId)) - Number(pending.has(a.inventoryId)) ||
    Number(rated.has(a.inventoryId)) - Number(rated.has(b.inventoryId)) ||
    (b.currentQty ?? 0) - (a.currentQty ?? 0));
  const queue=prioritizeRatingInventory(prioritized,inventoryId);
  const focus=inventoryId?inventory.find(item=>item.inventoryId===inventoryId):undefined;
  const portfolioValue = inventory.reduce((sum, item) => sum + (item.retailValue || 0) * (item.currentQty || 0), 0);
  return <main className="shell wideShell ratingsPage">
    <section className="ratingsHero"><div><div className="eyebrow">Professional reviews</div><h1>Published scores, with proof.</h1><p className="lede">Search exact cigar identities across established publications, review every match, and preserve the score beside the inventory lot without replacing your personal Vault score.</p></div><div className="ratingsMetric"><strong>{pending.size}</strong><span>lots ready for review</span><small>{ratings.length} sourced reviews saved</small></div></section>
    <UpgradeNudge plan={plan} context="ratings" usage={ratings.length} signals={{lotCount:inventory.length,portfolioValue}}/>
    <section className="ratingRules"><span>Exact brand + line + vitola</span><span>Vintage-aware matching</span><span>Direct source links</span><span>Weekly coverage scan</span><span>Manual approval before save</span></section>
    {focus&&<section className="card ratingFocus"><div><div className="eyebrow">Selected Vault record · {focus.inventoryId}</div><h2>{focus.brand} {focus.line}</h2><p>{focus.vitola}{focus.vintage?` · ${focus.vintage}`:" · year unspecified"}. Only ratings matching this exact identity can be proposed.</p></div><a className="button secondary" href={`/inventory/${encodeURIComponent(focus.inventoryId)}`}>Return to cigar record</a></section>}
    {inventoryId&&!focus&&<section className="card inventoryDataNotice"><strong>The requested Vault record is unavailable.</strong><p>No different cigar was substituted. Open the Vault and select the intended record again.</p></section>}
    <RatingResearchPanel items={queue.slice(0,40)} initialRatings={ratings} initialDrafts={drafts} focusInventoryId={focus?.inventoryId}/>
  </main>;
}
