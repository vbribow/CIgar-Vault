import {
  configurationChecks,
  healthScore,
  readableError,
  validSystemRuns,
  valuationOperationsSnapshot,
  type HealthCheck,
  type SystemRun,
} from "@/lib/system-health";
import { loadAccountRecords } from "@/lib/user-data";
import { loadInventory } from "@/lib/inventory";
import { loadCollections, loadValuations } from "@/lib/data";
import { checkSmartsheet } from "@/lib/smartsheet";
import { SystemHealthManager } from "@/components/system-health-manager";
import { valuationBatchSize, valuationCostEstimate, valuationMonthlyBudget } from "@/lib/valuation-monitor";
import type { CigarCollection, InventoryItem, Valuation } from "@/lib/types";
import "./system-health.css";

export const dynamic = "force-dynamic";

const settledValue = <T,>(result: PromiseSettledResult<T>, fallback: T): T =>
  result.status === "fulfilled" ? result.value : fallback;

export default async function SystemHealthPage() {
  const checks = configurationChecks(process.env);
  const smartsheet = checks.find(check => check.id === "smartsheet")!;

  if (smartsheet.status === "Ready") {
    try {
      const result = await checkSmartsheet();
      smartsheet.status = result.ok ? "Ready" : "Attention";
      smartsheet.detail = result.ok
        ? `${result.sheetName || "Inventory sheet"} is reachable`
        : result.missingColumns.length
          ? `Missing columns: ${result.missingColumns.join(", ")}`
          : "Connection requires attention";
    } catch (error) {
      smartsheet.status = "Unavailable";
      smartsheet.detail = readableError(error);
    }
  }

  const [runsResult, inventoryResult, valuationsResult, collectionsResult] = await Promise.allSettled([
    loadAccountRecords<SystemRun>("system-runs"),
    loadInventory(),
    loadValuations(),
    loadCollections(),
  ]);
  const runs = validSystemRuns(settledValue(runsResult, []) ?? []);
  const inventory = settledValue<InventoryItem[]>(inventoryResult, []);
  const valuations = settledValue<Valuation[]>(valuationsResult, []);
  const collections = settledValue<CigarCollection[]>(collectionsResult, []);
  const failedLoads = [
    runsResult.status === "rejected" && `run ledger: ${readableError(runsResult.reason)}`,
    inventoryResult.status === "rejected" && `inventory: ${readableError(inventoryResult.reason)}`,
    valuationsResult.status === "rejected" && `valuations: ${readableError(valuationsResult.reason)}`,
    collectionsResult.status === "rejected" && `collections: ${readableError(collectionsResult.reason)}`,
  ].filter((value): value is string => Boolean(value));
  const runtimeCheck: HealthCheck = {
    id: "runtime-data",
    name: "Operational data",
    description: "Private run ledger, inventory, and valuation diagnostics",
    status: failedLoads.length ? "Unavailable" : "Ready",
    detail: failedLoads.length ? failedLoads.join(" · ") : "All operational datasets loaded",
  };
  checks.push(runtimeCheck);

  const score = healthScore(checks, undefined, runs);
  const valuationControls = {
    batchSize: valuationBatchSize(),
    monthlyBudget: valuationMonthlyBudget(),
    estimatedCostPerResearch: valuationCostEstimate(),
  };
  const valuationSnapshot = valuationOperationsSnapshot(inventory, valuations, collections);

  return <main className="shell wideShell systemHealth">
    <section className="systemHero">
      <div>
        <div className="eyebrow">Platform operations</div>
        <h1>System Health Center.</h1>
        <p className="lede">See what is configured, verify live dependencies, run protected automations, and keep a plain-language record of failures.</p>
      </div>
      <div className={`systemScore ${score >= 80 ? "ready" : "attention"}`}>
        <strong>{score}%</strong>
        <span>operational readiness</span>
        <small>No secret values are displayed</small>
      </div>
    </section>
    <section className="healthChecks">
      {checks.map(check => <article className={check.status.toLowerCase()} key={check.id}>
        <span>{check.status}</span>
        <h2>{check.name}</h2>
        <p>{check.description}</p>
        <small>{check.detail}</small>
        {check.href && <a href={check.href}>Review setup →</a>}
      </article>)}
    </section>
    <SystemHealthManager
      initialRuns={runs.sort((a, b) => b.completedAt.localeCompare(a.completedAt))}
      valuationControls={valuationControls}
      valuationSnapshot={valuationSnapshot}
    />
  </main>;
}
