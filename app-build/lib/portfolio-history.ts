import type { InventoryItem, Valuation } from "@/lib/types";

export type PortfolioSnapshot = { date: string; value: number; valuedLots: number };
export type PortfolioMover = { item: InventoryItem; latestValue: number; previousValue: number; change: number; changePercent: number; lotChange: number };

const unitValue = (valuation: Valuation) => valuation.marketValue ?? valuation.replacementValue;

export function buildPortfolioHistory(inventory: InventoryItem[], valuations: Valuation[]) {
  const byItem = new Map<string, Valuation[]>();
  for (const valuation of valuations) {
    if (unitValue(valuation) === undefined) continue;
    const records = byItem.get(valuation.inventoryId) || [];
    records.push(valuation);
    byItem.set(valuation.inventoryId, records);
  }
  for (const records of byItem.values()) records.sort((a, b) => a.valuationDate.localeCompare(b.valuationDate));

  const dates = [...new Set(valuations.filter(value => unitValue(value) !== undefined).map(value => value.valuationDate))].sort();
  const snapshots: PortfolioSnapshot[] = dates.map(date => {
    let value = 0;
    let valuedLots = 0;
    for (const item of inventory) {
      const record = (byItem.get(item.inventoryId) || []).filter(entry => entry.valuationDate <= date).at(-1);
      const unit = record ? unitValue(record) : undefined;
      if (unit === undefined || item.currentQty === undefined) continue;
      value += unit * item.currentQty;
      valuedLots++;
    }
    return { date, value, valuedLots };
  });

  const movers: PortfolioMover[] = inventory.flatMap(item => {
    const records = byItem.get(item.inventoryId) || [];
    if (records.length < 2) return [];
    const latest = unitValue(records.at(-1)!);
    const previous = unitValue(records.at(-2)!);
    if (latest === undefined || previous === undefined || previous === 0) return [];
    const change = latest - previous;
    return [{ item, latestValue: latest, previousValue: previous, change, changePercent: Math.round(change / previous * 1000) / 10, lotChange: change * (item.currentQty || 0) }];
  }).sort((a, b) => Math.abs(b.lotChange) - Math.abs(a.lotChange));

  const latestByItem = new Map<string, Valuation>();
  for (const [id, records] of byItem) if (records.length) latestByItem.set(id, records.at(-1)!);
  const currentValue = inventory.reduce((sum, item) => sum + ((latestByItem.get(item.inventoryId) && unitValue(latestByItem.get(item.inventoryId)!)) ?? item.retailValue ?? 0) * (item.currentQty || 0), 0);
  const acquisitionCost = inventory.reduce((sum, item) => sum + (item.actualCost || 0), 0);
  const unrealizedChange = currentValue - acquisitionCost;
  const coverage = inventory.length ? Math.round(latestByItem.size / inventory.length * 100) : 0;

  const brands = new Map<string, number>();
  for (const item of inventory) {
    const unit = (latestByItem.get(item.inventoryId) && unitValue(latestByItem.get(item.inventoryId)!)) ?? item.retailValue ?? 0;
    brands.set(item.brand, (brands.get(item.brand) || 0) + unit * (item.currentQty || 0));
  }
  const brandAllocation = [...brands.entries()].map(([brand, value]) => ({ brand, value, percent: currentValue ? Math.round(value / currentValue * 1000) / 10 : 0 })).sort((a, b) => b.value - a.value);

  return { snapshots, movers, brandAllocation, totals: { currentValue, acquisitionCost, unrealizedChange, coverage } };
}
