import type { InventoryItem, Valuation } from "./types";
import { cigarMarketStandard } from "./cigar-market-standard";
import { claimsUnverifiedCompletedSale, isRetailConsensusValue, isVerifiedCompletedSale, marketEvidenceType } from "./valuation-evidence";
import { valuationQuantityPriority } from "./valuation-monitor";

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
    const latestVerifiedSale = records
      .filter(isVerifiedCompletedSale)
      .sort((a, b) => (b.lastSaleDate || "").localeCompare(a.lastSaleDate || ""))[0];
    const latestLegacySaleClaim = records.find(claimsUnverifiedCompletedSale);
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
    const evidenceType = marketEvidenceType(latest);
    const standard = cigarMarketStandard(item);
    const retailConsensus = isRetailConsensusValue(latest);
    const standardCovered = standard === "Habanos"
      ? Boolean(latestVerifiedSale)
      : retailConsensus || Boolean(latestVerifiedSale);
    const priorityScore = (item.retailValue === undefined ? 500 : 0)
      + (item.retailValue === undefined ? Math.round(valuationQuantityPriority(item) / 100) : 0)
      + (latest?.marketValue === undefined ? 120 : 0)
      + (freshness === "Never valued" ? 400 : freshness === "Stale" ? 300 : freshness === "Due soon" ? 150 : 0)
      + (latest?.sourceUrl ? 0 : 80)
      + Math.min(100, Math.round((marketLot ?? retailLot ?? 0) / 100));
    const missingEvidence=[
      retailUnit===undefined?"Retail replacement":undefined,
      evidenceType==="Insufficient evidence"?"Aftermarket evidence":undefined,
      !standardCovered?(standard === "Habanos"?"Completed sale":"Retail consensus"):undefined,
      !latest?.sourceUrl?"Linked source":undefined,
    ].filter((value):value is string=>Boolean(value));
    return { item, latest, latestVerifiedSale, latestLegacySaleClaim, previous, retailUnit, marketUnit, latestUnit, previousUnit, marketLot, retailLot, changePercent, freshness, evidenceType, standard, retailConsensus, standardCovered, records, priorityScore, missingEvidence };
  });

  const documentedMarketValue = rows.reduce((sum, row) => sum + (row.marketLot ?? 0), 0);
  const retailReplacementValue = rows.reduce((sum, row) => sum + (row.retailLot ?? 0), 0);
  return {
    rows,
    reviewQueue: [...rows].filter(row =>
      row.item.retailValue === undefined
      || (row.latest?.marketValue === undefined && row.evidenceType !== "Insufficient evidence")
      || row.freshness !== "Current"
      || (!row.latest?.sourceUrl && row.evidenceType !== "Insufficient evidence")
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
      saleCovered: rows.filter(row=>row.latestVerifiedSale).length,
      retailConsensusCovered: rows.filter(row=>row.retailConsensus).length,
      standardCovered: rows.filter(row=>row.standardCovered).length,
      askingCovered: rows.filter(row=>row.latest?.askingPrice!==undefined&&Boolean(row.latest.askingPriceSourceUrl)).length,
      retailCoveragePercent: percent(rows.filter(row=>row.retailUnit!==undefined).length,rows.length),
      marketCoveragePercent: percent(rows.filter(row=>row.marketUnit!==undefined).length,rows.length),
      saleCoveragePercent: percent(rows.filter(row=>row.latestVerifiedSale).length,rows.length),
      retailConsensusCoveragePercent: percent(rows.filter(row=>row.retailConsensus).length,rows.length),
      standardCoveragePercent: percent(rows.filter(row=>row.standardCovered).length,rows.length),
      habanosLots: rows.filter(row=>row.standard==="Habanos").length,
      newWorldLots: rows.filter(row=>row.standard==="New World").length,
      totalLots: rows.length,
    },
  };
}
