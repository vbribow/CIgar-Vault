import { ActivityManager } from "@/components/activity-manager";
import { dataMode } from "@/lib/config";
import { loadInventory } from "@/lib/inventory";
import { getActivities } from "@/lib/smartsheet";
export const dynamic="force-dynamic";
export default async function ActivityPage({searchParams}:{searchParams:Promise<{inventoryId?:string}>}){const query=await searchParams;const mode=dataMode();const[inventory,activities]=await Promise.all([loadInventory(),mode==="mock"?[]:getActivities()]);return <main className="shell"><nav className="nav"><a className="brand" href="/">Cigar Vault</a><div className="navLinks"><a href="/inventory">Inventory</a><a href="/records">Journal</a><span className="badge">Activity ledger</span></div></nav><section className="inventoryHeader"><div><h1>Collection activity</h1><p className="lede">A permanent record of what entered, moved through, and left your vault.</p></div></section><ActivityManager inventory={inventory} initialActivities={activities} mode={mode} selectedId={query.inventoryId}/></main>}
