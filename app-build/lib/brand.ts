export type BrandKey = "hojavia";

const neutralProductLabels = {
  community: "Collectors’ Lounge",
  communityRanking: "Hojavía 25",
  industryHub: "Industry Hub",
  learning: "Learning",
  places: "Places",
  loungePassport: "Lounge Passport",
  independentAssessment: "Independent location assessment",
  privateBeta: "Private beta",
} as const;

export function resolveBrand(_legacyPresentationValue?: string) {
  return {
    key: "hojavia" as const,
    name: "Hojavía",
    asciiName: "Hojavia",
    pronunciation: "oh-ha-VEE-ah",
    spokenName: "Hojavía (pronounced oh-ha-VEE-ah)",
    isPreview: false,
    signatureLine: "The Way of the Leaf",
    brandLine: "Knowledge carried forward.",
    productLine: "Know what you collect.",
    journeyLine: "From leaf to legacy.",
    communityLine: "The culture, carried forward.",
    description:
      "Understand, document, and preserve the people, places, knowledge, and traditions behind every premium cigar.",
    labels: neutralProductLabels,
  };
}

// Hojavía is the sole product identity. The unused argument on resolveBrand
// keeps old callers readable without allowing the retired presentation back.
export const brand = resolveBrand();
