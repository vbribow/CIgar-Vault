import type { InventoryItem, Valuation } from "./types";

export type ValuationFreshness = "Current" | "Due soon" | "Stale" | "Never valued";

const DAY_MS = 86_400_000;
const percent = (count:number,total:number) => total ? Math.round(count / total * 100) : 0;

export function valuationFreshness(date: string | undefined, now = new Date()): ValuationFreshness {
  if (!date) return "Never valued";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "Stale";
  const age = Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / DAY_MS));
  if (age > 180) return "Stale";
  if (age > 120) return "Due soon";
  return "Current";
}

export function buildValuationIntelligence(inventory: InventoryItem[], valuations: Valuation[], now = new Date()) {
  const history = new Map<string, Valuation[]>();
  for (const valuation of valuations) {
    const list = history.get(valuation.inventoryId) ?? [];
    list.push(valuation);
    history.set(valuation.inventoryId, list);
  }

  const rows = inventory.map(item => {
    const records = (history.get(item.inventoryId) ?? []).sort((a, b) => b.valuationDate.localeCompare(a.valuationDate));
    const latest = records[0];
    const previous = records[1];
    const retailUnit = item.retailValue ?? latest?.replacementValue;
    const marketUnit = latest?.marketValue;
    const latestUnit = marketUnit ?? retailUnit;
    const previousUnit = previous?.marketValue ?? previous?.replacementValue;
    const quantity = item.currentQty;
    const marketLot = marketUnit === undefined || quantity === undefined ? undefined : marketUnit * quantity;
    const retailLot = retailUnit === undefined || quantity === undefined ? undefined : retailUnit * quantity;
    const changePercent = latestUnit === undefined || previousUnit === undefined || previousUnit === 0 ? undefined : Math.round((latestUnit - previousUnit) / previousUnit * 1000) / 10;
    const freshness = valuationFreshness(latest?.valuationDate, now);
    const priorityScore = (item.retailValue === undefined ? 500 : 0)
      + (latest?.marketValue === undefined ? 120 : 0)
      + (freshness === "Never valued" ? 400 : freshness === "Stale" ? 300 : freshness === "Due soon" ? 150 : 0)
      + (latest?.sourceUrl ? 0 : 80)
      + Math.min(100, Math.round((marketLot ?? retailLot ?? 0) / 100));
    const missingEvidence=[
      retailUnit===undefined?"Retail replacement":undefined,
      marketUnit===undefined?"Aftermarket estimate":undefined,
      latest?.lastSaleValue===undefined?"Completed sale":undefined,
      !latest?.sourceUrl?"Linked source":undefined,
    ].filter((value):value is string=>Boolean(value));
    return { item, latest, previous, retailUnit, marketUnit, latestUnit, previousUnit, marketLot, retailLot, changePercent, freshness, records, priorityScore, missingEvidence };
  });

  const documentedMarketValue = rows.reduce((sum, row) => sum + (row.marketLot ?? 0), 0);
  const retailReplacementValue = rows.reduce((sum, row) => sum + (row.retailLot ?? 0), 0);
  return {
    rows,
    reviewQueue: [...rows].filter(row =>
      row.item.retailValue === undefined
      || row.latest?.marketValue === undefined
      || row.freshness !== "Current"
      || !row.latest?.sourceUrl
    ).sort((a, b) => b.priorityScore - a.priorityScore),
    totals: {
      documentedMarketValue,
      retailReplacementValue,
      current: rows.filter(row => row.freshness === "Current").length,
      dueSoon: rows.filter(row => row.freshness === "Due soon").length,
      stale: rows.filter(row => row.freshness === "Stale").length,
      neverValued: rows.filter(row => row.freshness === "Never valued").length,
      sourced: rows.filter(row => row.latest?.sourceUrl).length,
      retailCovered: rows.filter(row=>row.retailUnit!==undefined).length,
      marketCovered: rows.filter(row=>row.marketUnit!==undefined).length,
      saleCovered: rows.filter(row=>row.latest?.lastSaleValue!==undefined&&Boolean(row.latest.lastSaleSourceUrl)).length,
      retailCoveragePercent: percent(rows.filter(row=>row.retailUnit!==undefined).length,rows.length),
      marketCoveragePercent: percent(rows.filter(row=>row.marketUnit!==undefined).length,rows.length),
      saleCoveragePercent: percent(rows.filter(row=>row.latest?.lastSaleValue!==undefined&&Boolean(row.latest.lastSaleSourceUrl)).length,rows.length),
      totalLots: rows.length,
    },
  };
}
