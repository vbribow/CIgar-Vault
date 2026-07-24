import { canonicalBrand } from "./brand-directory";

export type CigarIdentityInput = {
  brand: string;
  line: string;
  vitola: string;
  vintage?: string | number | null;
};

export type CanonicalCigarIdentity = {
  identityId: string;
  identityKey: string;
  productKey: string;
  brand: string;
  line: string;
  vitola: string;
  release?: string;
  complete: boolean;
};

const placeholder = /^(unknown|n\/a|na|none|tbd|unspecified|not specified|vitola to verify|identity to verify)$/i;

export function normalizeIdentityPart(value: unknown) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stableId(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `CIG-${(hash >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

export function canonicalCigarIdentity(value: CigarIdentityInput): CanonicalCigarIdentity {
  const brand = canonicalBrand(value.brand);
  const line = value.line.trim();
  const vitola = value.vitola.trim();
  const release = value.vintage === undefined || value.vintage === null ? undefined : String(value.vintage).trim() || undefined;
  const productKey = [brand, line, vitola].map(normalizeIdentityPart).join("|");
  const identityKey = [...productKey.split("|"), normalizeIdentityPart(release)].join("|");
  const complete = [brand, line, vitola].every(part => Boolean(part) && !placeholder.test(part));
  return { identityId: stableId(identityKey), identityKey, productKey, brand, line, vitola, release, complete };
}

export function cigarIdentityKey(value: CigarIdentityInput) {
  return canonicalCigarIdentity(value).identityKey;
}

export function cigarProductKey(value: Pick<CigarIdentityInput, "brand" | "line" | "vitola">) {
  return canonicalCigarIdentity(value).productKey;
}

export function sameCigarIdentity(a: CigarIdentityInput, b: CigarIdentityInput) {
  return cigarIdentityKey(a) === cigarIdentityKey(b);
}
