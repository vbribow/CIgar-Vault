const usZipPattern = /^\d{5}(?:-\d{4})?$/;
const cityStatePattern = /^[\p{L}][\p{L} .’'-]{1,79},\s*(?:[A-Za-z]{2}|[\p{L}][\p{L} .’'-]{2,29})$/u;
const streetAddressPattern = /^\d{1,8}\s+[\p{L}0-9][\p{L}0-9 .,#’'/-]{3,112}$/u;

export function normalizePlaceSearch(value: string) {
  const location = value.trim().replace(/\s+/g, " ");
  if (!location || location.length > 120) return undefined;
  if (usZipPattern.test(location) || cityStatePattern.test(location) || streetAddressPattern.test(location)) return location;
  return undefined;
}

export const placeSearchHint = "Enter a U.S. street address, ZIP code, or city and state.";
