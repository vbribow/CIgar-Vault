import type { InventoryItem, Valuation } from "./types";

export type ValuationFreshness = "Current" | "Due soon" | "Stale" | "Never valued";

const DAY_MS = 86_400_000;
const unitValue = (valuation: Valuation | undefined) => valuation?.marketValue ?? valuation?.replacementValue;

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
    const latestUnit = unitValue(latest);
    const previousUnit = unitValue(previous);
    const quantity = item.currentQty;
    const marketLot = latestUnit === undefined || quantity === undefined ? undefined : latestUnit * quantity;
    const retailLot = item.retailValue === undefined || quantity === undefined ? undefined : item.retailValue * quantity;
    const changePercent = latestUnit === undefined || previousUnit === undefined || previousUnit === 0 ? undefined : Math.round((latestUnit - previousUnit) / previousUnit * 1000) / 10;
    const freshness = valuationFreshness(latest?.valuationDate, now);
    const priorityScore = (freshness === "Never valued" ? 400 : freshness === "Stale" ? 300 : freshness === "Due soon" ? 150 : 0)
      + (latest?.sourceUrl ? 0 : 80)
      + Math.min(100, Math.round((marketLot ?? retailLot ?? 0) / 100));
    return { item, latest, previous, latestUnit, previousUnit, marketLot, retailLot, changePercent, freshness, records, priorityScore };
  });

  const documentedMarketValue = rows.reduce((sum, row) => sum + (row.marketLot ?? 0), 0);
  const retailReplacementValue = rows.reduce((sum, row) => sum + (row.retailLot ?? 0), 0);
  return {
    rows,
    reviewQueue: [...rows].filter(row => row.freshness !== "Current" || !row.latest?.sourceUrl).sort((a, b) => b.priorityScore - a.priorityScore),
    totals: {
      documentedMarketValue,
      retailReplacementValue,
      current: rows.filter(row => row.freshness === "Current").length,
      dueSoon: rows.filter(row => row.freshness === "Due soon").length,
      stale: rows.filter(row => row.freshness === "Stale").length,
      neverValued: rows.filter(row => row.freshness === "Never valued").length,
      sourced: rows.filter(row => row.latest?.sourceUrl).length,
    },
  };
}
