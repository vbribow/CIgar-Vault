import type { InventoryItem } from "./types";

type ValuationEvidenceLike = {
  replacementValue?: number | null;
  marketValue?: number | null;
  marketRangeLow?: number | null;
  marketRangeHigh?: number | null;
  askingPrice?: number | null;
  askingPriceSource?: string | null;
  askingPriceSourceUrl?: string | null;
  lastSaleValue?: number | null;
  source?: string | null;
  sourceUrl?: string | null;
  notes?: string | null;
  comparables?: Array<{
    title?: string;
    url?: string;
    notes?: string;
  }>;
};

const explicitMixedSetPattern =
  /\b(?:whole|complete|full)\s+(?:\d+\s*[- ]?cigar\s+)?(?:collection|set|sampler|presentation|assortment|box)\b|\b\d+\s*[- ]?cigar\s+(?:collection|set|sampler|presentation|assortment|box)\b|\bbox\s+of\s+\d+\b/i;

const allocationPattern =
  /\b(?:normaliz(?:e|ed|ation)|allocat(?:e|ed|ion)|divid(?:e|ed)|prorat(?:e|ed))\b.{0,100}\b(?:collection|set|sampler|presentation|assortment|mixed|pack)\b|\b(?:collection|set|sampler|presentation|assortment|mixed|pack)\b.{0,100}\b(?:normaliz(?:e|ed|ation)|allocat(?:e|ed|ion)|divid(?:e|ed)|prorat(?:e|ed))\b/i;

const mixedSetUrlPattern =
  /(?:collection|sampler|assort(?:ed|ment)|presentation|box[-_/ ]?of[-_/ ]?\d+|la[-_/ ]gran[-_/ ]fumada|from[-_/ ]dream[-_/ ]to[-_/ ]dynasty|father[-_/ ]and[-_/ ](?:his[-_/ ])?son)/i;

export function valuationEvidenceText(value: ValuationEvidenceLike) {
  return [
    value.source,
    value.sourceUrl,
    value.notes,
    value.askingPriceSource,
    value.askingPriceSourceUrl,
    ...(value.comparables ?? []).flatMap(item => [item.title, item.url, item.notes]),
  ].filter(Boolean).join(" ");
}

export function hasMixedCollectionAllocation(value: ValuationEvidenceLike) {
  const text = valuationEvidenceText(value);
  const urls = [
    value.sourceUrl,
    value.askingPriceSourceUrl,
    ...(value.comparables ?? []).map(item => item.url),
  ].filter(Boolean).join(" ");
  return allocationPattern.test(text)
    || (explicitMixedSetPattern.test(text) && mixedSetUrlPattern.test(urls));
}

export function valuationIntegrityIssues(
  item: Pick<InventoryItem, "collectionId">,
  value: ValuationEvidenceLike,
) {
  const carriesPrice = [
    value.replacementValue,
    value.marketValue,
    value.marketRangeLow,
    value.marketRangeHigh,
    value.askingPrice,
    value.lastSaleValue,
  ].some(amount => amount !== undefined && amount !== null);

  if (!item.collectionId || !carriesPrice || !hasMixedCollectionAllocation(value)) return [];
  return [
    "A mixed collection, sampler, or presentation price cannot be allocated to an individual component cigar. Use exact individual-cigar evidence.",
  ];
}

export function assertValuationIntegrity(
  item: Pick<InventoryItem, "collectionId">,
  value: ValuationEvidenceLike,
) {
  const issues = valuationIntegrityIssues(item, value);
  if (issues.length) throw new Error(issues.join(" "));
}
