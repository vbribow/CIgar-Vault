import type { CatalogCigar } from "./types";
import { canonicalBrand, cigarBrands } from "./brand-directory";
import { allBrandManufacturingCoverage, type BrandManufacturingCoverage } from "./manufacturing-truth";

export type DiscoveryClassification = "New brand" | "New release" | "Possible duplicate";

export type BrandResearchItem = BrandManufacturingCoverage & {
  priority: "Boutique priority" | "Established priority" | "Historical follow-up";
  missing: string[];
};

export function brandResearchBrief(item: BrandResearchItem) {
  const countryKnown = item.status === "Country verified";
  return {
    question: countryKnown
      ? `Which factory made each documented ${item.brand} release, and during which production period?`
      : `Who owns ${item.brand}, who shaped its cigars, and which factory actually manufactured each release?`,
    sourceOrder: countryKnown
      ? ["Official product or regional-release record", "Dated packaging, box code, or factory documentation", "Corroborating historical or trade source"]
      : ["Official brand or manufacturer profile", "Direct factory, distributor, or launch announcement", "Corroborating interview or established trade report"],
    publicationRule: "Record the owner, creative authorship, actual factory, release or line, production period, source date, and confidence separately. Never extend evidence from one cigar to the entire brand.",
  };
}

export const brandResearchSources = [
  {
    name: "Official manufacturer newsrooms",
    kind: "Primary evidence",
    cadence: "Every scan",
    use: "Launches, ownership, blends, factory disclosure, packaging changes",
    href: "/learn/manufacturing-truth#directory",
  },
  {
    name: "Premium Cigar Association",
    kind: "Industry signal",
    cadence: "Weekly + show season",
    use: "New exhibitors, product announcements, company changes",
    href: "https://premiumcigars.org/",
  },
  {
    name: "Tobacco Plus Expo",
    kind: "Industry signal",
    cadence: "Weekly + show season",
    use: "Emerging brands, exhibitors, private-label and distribution leads",
    href: "https://tobaccoplusexpo.com/",
  },
  {
    name: "Habanos official newsroom",
    kind: "Primary evidence",
    cadence: "Weekly",
    use: "Official Cuban launches, vitolas, packaging, regional editions",
    href: "https://www.habanos.com/en/news/",
  },
  {
    name: "Established cigar trade reporting",
    kind: "Discovery signal",
    cadence: "Every scan",
    use: "Cross-check announcements and surface boutique releases",
    href: "https://halfwheel.com/category/news/",
  },
] as const;

function fold(value: string) {
  return canonicalBrand(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\b(cigar company|cigar co\.?|cigars?)\b/g, "")
    .replace(/[^a-z0-9()]+/g, " ")
    .trim();
}

function productKey(item: Pick<CatalogCigar, "brand" | "line" | "vitola">) {
  return [fold(item.brand), fold(item.line), fold(item.vitola)].join("|");
}

export function classifyDiscovery(item: CatalogCigar, catalog: CatalogCigar[]): DiscoveryClassification {
  if (catalog.some((known) => productKey(known) === productKey(item))) return "Possible duplicate";
  if (catalog.some((known) => fold(known.brand) === fold(item.brand)) || cigarBrands.some((known) => fold(known.name) === fold(item.brand))) return "New release";
  return "New brand";
}

export function brandResearchBacklog(): BrandResearchItem[] {
  return allBrandManufacturingCoverage
    .filter((record) => record.status !== "Factory verified")
    .map((record) => ({
      ...record,
      priority: record.segment === "Boutique" ? "Boutique priority" as const : record.segment === "Habanos" ? "Historical follow-up" as const : "Established priority" as const,
      missing: record.status === "Country verified"
        ? ["factory", "release period", "source"]
        : ["brand owner", "blender", "factory", "relationship", "source"],
    }))
    .sort((a, b) => {
      const order = { "Boutique priority": 0, "Established priority": 1, "Historical follow-up": 2 };
      return order[a.priority] - order[b.priority] || a.brand.localeCompare(b.brand);
    });
}

export function brandCoverageWithCatalog(catalog: CatalogCigar[]) {
  const known = new Map(allBrandManufacturingCoverage.map((record) => [fold(record.brand), record]));
  for (const item of catalog) {
    const key = fold(item.brand);
    const current = known.get(key);
    if (current?.status === "Factory verified") continue;
    if (item.factory) {
      known.set(key, {
        brand: item.brand,
        primaryRegion: item.country || current?.primaryRegion || "Unclassified",
        segment: current?.segment || "Newly documented",
        status: "Factory verified",
        manufacturing: item.factory,
        evidence: "Founder-approved catalog evidence · release-level source retained",
        href: item.sourceUrl || "/learn/manufacturing-truth#research-standard",
        sourceUrl: item.sourceUrl,
      });
    } else if (!current) {
      known.set(key, {
        brand: item.brand,
        primaryRegion: item.country || "Unclassified",
        segment: "Newly documented",
        status: "Research needed",
        manufacturing: "Brand approved into Cedriva; actual factory remains an open evidence question",
        evidence: "Founder-approved discovery · factory unresolved",
        href: "/learn/manufacturing-truth#research-standard",
        sourceUrl: item.sourceUrl,
      });
    }
  }
  return [...known.values()].sort((a, b) => a.brand.localeCompare(b.brand));
}
