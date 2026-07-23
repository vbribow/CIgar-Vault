import type { CigarVisionResult } from "./cigar-vision";
import type { InventoryItem } from "./types";

export const correctionFields = ["brand", "line", "vitola", "vintage", "packaging", "fullBoxQty", "sticksPerBox", "looseStickQty", "boxCode"] as const;
export type CorrectionField = typeof correctionFields[number];
export const correctionLabels: Record<CorrectionField, string> = { brand: "Brand", line: "Line / series", vitola: "Vitola", vintage: "Production / release year", packaging: "Packaging", fullBoxQty: "Full boxes", sticksPerBox: "Cigars per box", looseStickQty: "Loose sticks", boxCode: "Box code" };

function comparable(value: unknown) { return String(value ?? "").trim().toLocaleLowerCase(); }

export function correctionSuggestions(item: InventoryItem, result: CigarVisionResult) {
  return correctionFields.flatMap((field) => {
    const suggested = result[field];
    if (suggested === null || suggested === undefined || comparable(suggested) === "" || comparable(item[field]) === comparable(suggested)) return [];
    return [{ field, label: correctionLabels[field], current: item[field], suggested }];
  });
}

export function applyCorrectionSuggestions(item: InventoryItem, result: CigarVisionResult, approved: CorrectionField[]) {
  return approved.reduce<InventoryItem>((next, field) => ({ ...next, [field]: result[field] }), { ...item });
}
