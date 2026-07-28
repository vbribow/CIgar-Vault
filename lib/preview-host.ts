const activeProductHostnames = new Set([
  "hojavia.com",
  "www.hojavia.com",
  "c-igar-vault-lmug.vercel.app",
  "cedriva-app.brian-bowers-3344.chatgpt.site",
]);

export function isActiveProductHostname(hostname: string): boolean {
  return activeProductHostnames.has(hostname.trim().toLowerCase());
}

export function isPrivatePreviewHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");

  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "::1" ||
    normalized.startsWith("127.") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(normalized)
  );
}
