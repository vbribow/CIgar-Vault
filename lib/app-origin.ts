export function appOrigin(requestOrigin: string, productionHost?: string) {
  const host = productionHost?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return host ? `https://${host}` : requestOrigin.replace(/\/$/, "");
}
