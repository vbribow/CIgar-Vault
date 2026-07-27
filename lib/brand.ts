export type BrandKey = "cedriva" | "hojavia";

const neutralProductLabels = {
  community: "Collectors’ Lounge",
  communityRanking: "Collector 25",
  industryHub: "Industry Hub",
  learning: "Learning",
  places: "Places",
  loungePassport: "Lounge Passport",
  independentAssessment: "Independent location assessment",
  privateBeta: "Private beta",
} as const;

export function resolveBrand(presentationValue?: string) {
  return presentationValue?.trim().toLowerCase() === "cedriva"
  ? {
      key: "cedriva" as const,
      name: "Cedriva",
      asciiName: "Cedriva",
      isPreview: false,
      brandLine: "Preserve · Honor · Grow",
      productLine: "Know what you collect.",
      journeyLine: "From leaf to legacy.",
      communityLine: "Premium cigar culture",
      description:
        "Learn with confidence, document with purpose, and preserve the people, stories, and traditions behind every premium cigar.",
      labels: neutralProductLabels,
    }
  : {
      key: "hojavia" as const,
      name: "Hojavía",
      asciiName: "Hojavia",
      isPreview: true,
      brandLine: "Knowledge carried forward.",
      productLine: "Know what you collect.",
      journeyLine: "From leaf to legacy.",
      communityLine: "The culture, carried forward.",
      description:
        "Understand, document, and preserve the people, places, knowledge, and traditions behind every premium cigar.",
      labels: neutralProductLabels,
    };
}

// Hojavía is the only invited-tester presentation. Keeping this deterministic
// prevents server and client branding from diverging during hydration.
export const brand = resolveBrand();
