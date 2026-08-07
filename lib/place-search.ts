const usZipPattern = /^\d{5}(?:-\d{4})?$/;
const cityStatePattern = /^[\p{L}][\p{L} .’'-]{1,79},\s*(?:[A-Za-z]{2}|[\p{L}][\p{L} .’'-]{2,29})$/u;

export function normalizePlaceSearch(value: string) {
  const location = value.trim().replace(/\s+/g, " ");
  if (!location || location.length > 120) return undefined;
  if (usZipPattern.test(location) || cityStatePattern.test(location)) return location;
  return undefined;
}

export const placeSearchHint = "Enter a U.S. ZIP code or city and state, such as 90210 or Anchorage, AK.";
