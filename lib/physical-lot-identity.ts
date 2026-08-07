import type { InventoryItem } from "./types";

const trailingLotDesignation = /\s*(?:[-\u2013\u2014,:]\s*|\(\s*)?(?:physical\s+)?(box|lot)\s*(?:#|no\.?|number)?\s*(\d+)\s*\)?\s*$/i;

export type PhysicalLotDesignation = {
  canonicalVitola: string;
  kind: "Box" | "Lot";
  number: number;
  label: string;
};

/**
 * A physical box/lot number belongs to provenance, never cigar identity.
 * Only an explicit trailing numeric designation is removed; names such as
 * "Box Pressed" and unresolved descriptions such as "Assorted / box" remain.
 */
export function physicalLotDesignation(vitola: string): PhysicalLotDesignation | undefined {
  const match = vitola.match(trailingLotDesignation);
  if (!match || match.index === undefined) return undefined;
  const canonicalVitola = vitola.slice(0, match.index).trim();
  if (!canonicalVitola) return undefined;
  const kind = match[1].toLowerCase() === "box" ? "Box" : "Lot";
  const number = Number(match[2]);
  return { canonicalVitola, kind, number, label: `${kind} ${number}` };
}

export function canonicalVitolaName(vitola: string) {
  return physicalLotDesignation(vitola)?.canonicalVitola ?? vitola.trim();
}

const normalized = (value: unknown) => String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const release = (item: InventoryItem) => String(item.vintage ?? "").trim();

export type ReleaseLotIntegrityIssue = {
  inventoryId: string;
  code: "lot-label-in-vitola" | "release-year-missing" | "cross-release-value-gap";
  message: string;
  suggestedVitola?: string;
};

/** Read-only audit: it never combines, deletes, or mutates physical inventory lots. */
export function releaseLotIntegrityIssues(items: InventoryItem[]): ReleaseLotIntegrityIssue[] {
  const issues: ReleaseLotIntegrityIssue[] = [];
  const groups = new Map<string, InventoryItem[]>();

  for (const item of items) {
    const designation = physicalLotDesignation(item.vitola);
    if (designation) {
      issues.push({
        inventoryId: item.inventoryId,
        code: "lot-label-in-vitola",
        message: `${designation.label} belongs in provenance or lot notes; use exact vitola “${designation.canonicalVitola}”.`,
        suggestedVitola: designation.canonicalVitola,
      });
    }
    const key = [item.brand, item.line, canonicalVitolaName(item.vitola)].map(normalized).join("|");
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const item of group) {
      if (!release(item)) {
        issues.push({
          inventoryId: item.inventoryId,
          code: "release-year-missing",
          message: "This cigar appears in multiple physical lots. Record the exact release year before comparing or reusing value evidence.",
        });
      }
    }

    const datedValues = group.filter(item => release(item) && typeof item.retailValue === "number" && item.retailValue > 0);
    const distinctReleases = new Set(datedValues.map(release));
    if (datedValues.length < 2 || distinctReleases.size < 2) continue;
    const values = datedValues.map(item => item.retailValue as number);
    const low = Math.min(...values), high = Math.max(...values);
    if ((high - low) / low < 0.25) continue;
    for (const item of datedValues) {
      issues.push({
        inventoryId: item.inventoryId,
        code: "cross-release-value-gap",
        message: `Values for this exact cigar differ by ${Math.round(((high - low) / low) * 100)}% across documented releases. Confirm evidence names the ${release(item)} release before relying on it.`,
      });
    }
  }
  return issues;
}
