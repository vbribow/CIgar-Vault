export function safeAuthNext(value: FormDataEntryValue | null, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  try {
    const base = new URL("https://hojavia.invalid");
    const destination = new URL(value, base);
    if (destination.origin !== base.origin) return fallback;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
