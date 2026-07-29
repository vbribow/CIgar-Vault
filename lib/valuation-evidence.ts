import type { Valuation } from "./types";

export const marketEvidenceTypes = [
  "Verified completed sale",
  "Estimated market range",
  "Observed asking price",
  "Insufficient evidence",
] as const;

export type MarketEvidenceType = typeof marketEvidenceTypes[number];
export const marketAskingPriceLabel = "Market asking price — no confirmed sale";

export function latestValuationWith(
  values: Valuation[],
  predicate: (value: Valuation) => boolean,
): Valuation | undefined {
  return [...values]
    .filter(predicate)
    .sort((left, right) =>
      right.valuationDate.localeCompare(left.valuationDate) ||
      right.valuationId.localeCompare(left.valuationId)
    )[0];
}

export function isVerifiedCompletedSale(value?: Valuation): boolean {
  return Boolean(value && value.lastSaleValue !== undefined && value.lastSaleDate && value.lastSaleSourceUrl);
}

export function claimsUnverifiedCompletedSale(value?: Valuation): boolean {
  if (!value || isVerifiedCompletedSale(value)) return false;
  if (
    value.lastSaleValue === undefined &&
    value.marketEvidenceType &&
    value.marketEvidenceType !== "Verified completed sale"
  ) return false;
  const claimText = [value.marketEvidenceType, value.source, value.notes].filter(Boolean).join(" ");
  return value.lastSaleValue !== undefined || /completed[\s-]*sale/i.test(claimText);
}

export function completedSaleLabel(value?: Valuation): string {
  if (isVerifiedCompletedSale(value)) return "Verified completed sale";
  if (claimsUnverifiedCompletedSale(value)) return "Legacy market value — completed sale unverified";
  return "No verified completed sale";
}

export function marketEvidenceType(value?: Valuation): MarketEvidenceType {
  if (value?.marketEvidenceType === "Verified completed sale" && !isVerifiedCompletedSale(value)) {
    return value.marketValue !== undefined ? "Estimated market range" : "Insufficient evidence";
  }
  if (value?.marketEvidenceType && marketEvidenceTypes.includes(value.marketEvidenceType)) {
    return value.marketEvidenceType;
  }
  if (isVerifiedCompletedSale(value)) {
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
