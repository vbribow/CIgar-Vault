import { RecordsManager } from "@/components/records-manager";
import { dataMode } from "@/lib/config";
import { loadInventory } from "@/lib/inventory";
import { getSmokingLogs, getValuations } from "@/lib/smartsheet";
export const dynamic="force-dynamic";
export default async function RecordsPage(){const mode=dataMode();const [inventory,smokes,valuations]=await Promise.all([loadInventory(),mode==="mock"?[]:getSmokingLogs(),mode==="mock"?[]:getValuations()]);return <main className="shell"><nav className="nav"><a className="brand" href="/">Cigar Vault</a><a className="badge" href="/inventory">Inventory</a></nav><section className="section inventoryHeader"><h1>Journal & value</h1><p className="lede">Record every smoke and preserve a dated valuation history.</p></section><RecordsManager inventory={inventory} initialSmokes={smokes} initialValuations={valuations} mode={mode}/></main>}
