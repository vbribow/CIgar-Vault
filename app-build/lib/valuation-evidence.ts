import type { Valuation } from "./types";

export const marketEvidenceTypes = [
  "Verified completed sale",
  "Estimated market range",
  "Observed asking price",
  "Insufficient evidence",
] as const;

export type MarketEvidenceType = typeof marketEvidenceTypes[number];

export function marketEvidenceType(value?: Valuation): MarketEvidenceType {
  if (value?.marketEvidenceType && marketEvidenceTypes.includes(value.marketEvidenceType)) {
    return value.marketEvidenceType;
  }
  if (value?.lastSaleValue !== undefined && value.lastSaleDate && value.lastSaleSourceUrl) {
    return "Verified completed sale";
  }
  if (value?.marketValue !== undefined || (value?.marketRangeLow !== undefined && value.marketRangeHigh !== undefined)) {
    return "Estimated market range";
  }
  if (value?.askingPrice !== undefined && value.askingPriceSourceUrl) {
    return "Observed asking price";
  }
  return "Insufficient evidence";
}

export function marketRangeText(value?: Valuation) {
  if (value?.marketRangeLow === undefined || value.marketRangeHigh === undefined) return undefined;
  const money = (amount: number) => amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value.marketRangeLow === value.marketRangeHigh
    ? money(value.marketRangeLow)
    : `${money(value.marketRangeLow)}–${money(value.marketRangeHigh)}`;
}
