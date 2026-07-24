import type { CatalogCigar } from "./types";

export type DiscoveryGoal = "Begin comfortably" | "Expand my palate" | "Study origin and craft" | "Find a collectible";
export type StrengthPreference = "Any strength" | "Mild" | "Medium" | "Full";

export type DiscoveryPreferences = {
  goal: DiscoveryGoal;
  strength: StrengthPreference;
  origin: string;
};

export type DiscoveryMatch = { cigar: CatalogCigar; score: number; reasons: string[] };

const normalized = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase();
const statedStrength = (cigar: CatalogCigar) => normalized(cigar.strength);

export function discoveryMatches(catalog: CatalogCigar[], ownedBrands: string[], preferences: DiscoveryPreferences, limit = 6): DiscoveryMatch[] {
  const owned = new Set(ownedBrands.map(normalized));
  const scored = catalog.map((cigar) => {
    let score = cigar.sourceUrl ? 3 : 0;
    const reasons: string[] = [];
    const strength = statedStrength(cigar);
    const unfamiliarMaker = !owned.has(normalized(cigar.brand));

    if (preferences.strength !== "Any strength") {
      if (strength.includes(normalized(preferences.strength))) {
        score += 10;
        reasons.push(`Matches your ${preferences.strength.toLowerCase()} strength preference`);
      } else if (strength) score -= 4;
    }
    if (preferences.origin !== "Any origin" && normalized(cigar.country) === normalized(preferences.origin)) {
      score += 9;
      reasons.push(`Documented ${cigar.country} origin`);
    }

    if (preferences.goal === "Begin comfortably") {
      if (strength.includes("mild")) { score += 9; reasons.push("A gentler documented starting profile"); }
      else if (strength.includes("medium")) { score += 5; reasons.push("Balanced strength for continued exploration"); }
      if (cigar.sourceUrl) score += 2;
    }
    if (preferences.goal === "Expand my palate") {
      if (unfamiliarMaker) { score += 9; reasons.push("A maker not currently represented in your vault"); }
      if (cigar.wrapper || cigar.wrapperOrigin) { score += 3; reasons.push("Wrapper detail gives you a useful point of comparison"); }
    }
    if (preferences.goal === "Study origin and craft") {
      if (cigar.factory) { score += 6; reasons.push(`Manufacturing documented at ${cigar.factory}`); }
      if (cigar.blender) { score += 5; reasons.push(`Creative authorship attributed to ${cigar.blender}`); }
      if (cigar.wrapper || cigar.binder || cigar.filler) score += 4;
    }
    if (preferences.goal === "Find a collectible") {
      if (cigar.edition) { score += 7; reasons.push(cigar.edition); }
      if (cigar.releaseYear) { score += 4; reasons.push(`Release year ${cigar.releaseYear}`); }
      if (cigar.discontinued) { score += 6; reasons.push("Documented as discontinued"); }
      if (cigar.packaging) score += 3;
    }
    if (!reasons.length) reasons.push(cigar.sourceUrl ? "Documented cigar with a visible source" : "A catalog identity worth further research");
    return { cigar, score, reasons: reasons.slice(0, 3) };
  }).sort((a, b) => b.score - a.score || Number(Boolean(b.cigar.sourceUrl)) - Number(Boolean(a.cigar.sourceUrl)) || a.cigar.brand.localeCompare(b.cigar.brand));

  const seenBrands = new Set<string>();
  return scored.filter((match) => {
    const brand = normalized(match.cigar.brand);
    if (seenBrands.has(brand)) return false;
    seenBrands.add(brand);
    return true;
  }).slice(0, limit);
}
