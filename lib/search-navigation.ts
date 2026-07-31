export const searchQueryParam = "vaultSearch";
export const searchReturnParam = "searchReturn";
export const recentSearchLimit = 5;

const localOrigin = "https://hojavia.local";

export function safeInternalHref(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return;
  try {
    const url = new URL(value, localOrigin);
    if (url.origin !== localOrigin) return;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return;
  }
}

export function buildSearchRestoreHref(originHref: string, query: string) {
  const safeOrigin = safeInternalHref(originHref) || "/";
  const url = new URL(safeOrigin, localOrigin);
  url.searchParams.set(searchQueryParam, query.trim());
  return `${url.pathname}${url.search}${url.hash}`;
}

export function buildSearchResultHref(
  resultHref: string,
  originHref: string,
  query: string,
) {
  const safeResult = safeInternalHref(resultHref) || "/";
  const url = new URL(safeResult, localOrigin);
  url.searchParams.set(
    searchReturnParam,
    buildSearchRestoreHref(originHref, query),
  );
  return `${url.pathname}${url.search}${url.hash}`;
}

export function normalizeRecentSearches(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const searches: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const query = entry.trim().slice(0, 120);
    const key = query.toLocaleLowerCase();
    if (query.length < 2 || seen.has(key)) continue;
    seen.add(key);
    searches.push(query);
    if (searches.length === recentSearchLimit) break;
  }
  return searches;
}

export function parseRecentSearches(serialized: string | null) {
  if (!serialized) return [];
  try {
    return normalizeRecentSearches(JSON.parse(serialized));
  } catch {
    return [];
  }
}

export function rememberRecentSearch(current: string[], query: string) {
  return normalizeRecentSearches([query, ...current]);
}
