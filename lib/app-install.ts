export const canonicalAppOrigin = "https://hojavia.com";
export const canonicalInstallUrl = `${canonicalAppOrigin}/install`;
export const installConfirmationEvent = "app-install-confirmed" as const;

export function appBuildVersion(env: Record<string, string | undefined> = process.env) {
  return (env.VERCEL_GIT_COMMIT_SHA || env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "development").slice(0, 7);
}

export function isCanonicalAppHost(hostname: string) {
  const host = hostname.trim().toLowerCase();
  return host === "hojavia.com" || host === "www.hojavia.com";
}
