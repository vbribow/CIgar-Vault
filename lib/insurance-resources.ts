export type InsuranceResource = {
  name: string;
  category: string;
  description: string;
  considerations: string;
  href: string;
};

export const insuranceResources: InsuranceResource[] = [
  {
    name: "Collectibles Insurance Services",
    category: "Specialist collectibles coverage",
    description:
      "A collection-focused insurer that invites inquiries for collection types beyond its published list.",
    considerations:
      "Ask for written confirmation that consumable premium cigars qualify. Its published exclusions include atmospheric dampness or dryness and temperature extremes other than fire.",
    href: "https://collectinsure.com/",
  },
  {
    name: "American Collectors Insurance",
    category: "Agreed-value collectibles coverage",
    description:
      "Offers agreed-value policies for qualifying collections and asks collectors with unlisted collection types to speak with a product specialist.",
    considerations:
      "Confirm that cigars are an eligible collection class, how opened boxes and individual sticks are treated, and what documentation establishes agreed value.",
    href: "https://americancollectors.com/agents/insurance/collectibles/",
  },
  {
    name: "Chubb Masterpiece",
    category: "High-value home and valuable articles",
    description:
      "Provides individualized coverage options for valuable collections through its high-value personal insurance program.",
    considerations:
      "Ask a Chubb-appointed broker whether cigars can be scheduled or covered as a collection and whether spoilage, humidity, temperature, transit, and newly acquired items are included.",
    href: "https://www.chubb.com/us-en/individuals-families/products/valuables/your-collections.html",
  },
];

export const insuranceQuestions = [
  "Are premium cigars explicitly eligible property under the policy?",
  "Is settlement based on agreed value, retail replacement value, or actual cash value?",
  "Are humidity changes, temperature changes, mold, infestation, and gradual deterioration excluded?",
  "What proof is required for individual sticks, sealed boxes, rare releases, and complete collections?",
  "Are cigars covered in transit, temporary storage, travel, and newly acquired inventory?",
];
