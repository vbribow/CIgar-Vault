export type BrandKey = "cedriva" | "hojavia";

export function resolveBrand(previewValue?: string) {
  return previewValue === "hojavia"
  ? {
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
    }
  : {
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
    };
}

export const brand = resolveBrand(process.env.NEXT_PUBLIC_BRAND_PREVIEW);
