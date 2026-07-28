import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const organizationName = brand.name;
export const organizationDescription = brand.description;

// Legacy exports remain temporarily for source compatibility. Visible values
// resolve through the centralized brand configuration.
export const cedrivaName = organizationName;
export const cedrivaDescription = organizationDescription;

const fallbackSiteUrl = "https://c-igar-vault-lmug.vercel.app";

export function siteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    fallbackSiteUrl;
  const value = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  return value.replace(/\/+$/, "");
}

export function absoluteSiteUrl(path = "/") {
  return new URL(path, `${siteUrl()}/`).toString();
}

export function publicPageMetadata(title: string, description: string, canonicalPath: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: {
      index: !brand.isPreview,
      follow: !brand.isPreview,
      googleBot: {
        index: !brand.isPreview,
        follow: !brand.isPreview,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export const learningPages = [
  { path: "/learn", name: `${brand.name} ${brand.labels.learning}`, description: "Premium cigar education that grows with the collector." },
  { path: "/learn/foundations", name: "Cigar Foundations", description: "A welcoming introduction to choosing, preparing, enjoying, and caring for a premium cigar." },
  { path: "/learn/seed-to-smoke", name: "Seed to Smoke", description: "Follow tobacco through agriculture, curing, fermentation, blending, rolling, and stewardship." },
  { path: "/learn/vitolas", name: "Understanding Vitolas", description: "Learn how cigar dimensions and shapes influence construction and experience." },
  { path: "/learn/blending", name: "Blending & Master Blenders", description: "Study leaf architecture, blending discipline, and documented master blenders." },
  { path: "/learn/resting-and-aging", name: "Resting & Aging Cigars", description: "Understand arrival rest, acclimation, and deliberate long-term cigar aging." },
  { path: "/learn/humidor-climate", name: "Humidor Temperature & Humidity", description: "Protect premium cigars through stable, evidence-aware storage." },
  { path: "/learn/manufacturing-truth", name: "Who Actually Makes the Cigar?", description: "Connect brands, blenders, factories, tobacco regions, releases, and evidence." },
] as const;

export const publicStaticPages = [
  ...learningPages,
  { path: "/manifesto", name: `The ${brand.name} Manifesto`, description: "A declaration for premium cigar culture, knowledge, craftsmanship, and community." },
  { path: "/constitution", name: `The ${brand.name} Constitution`, description: `${brand.name}’s purpose, commitments, and promise to premium cigar culture.` },
  { path: "/data-model", name: `How ${brand.name} Understands a Cigar`, description: `${brand.name}’s collector-centered model for identity, releases, provenance, evidence, and legacy.` },
  { path: "/industry", name: `${brand.name} ${brand.labels.industryHub}`, description: "Official manufacturer profiles, announcements, releases, packaging changes, and alerts." },
  { path: "/industry/registry", name: "Official Product & Release Registry", description: "Official products, releases, packaging revisions, and evidence-aware cigar records." },
] as const;

export function cedrivaOrganizationJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: cedrivaName,
        url,
        logo: absoluteSiteUrl("/icons/cedriva-512.png"),
        description: cedrivaDescription,
        slogan: "Preserve. Honor. Grow.",
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: cedrivaName,
        description: cedrivaDescription,
        publisher: { "@id": `${url}/#organization` },
        inLanguage: "en-US",
      },
    ],
  };
}

export function learningCollectionJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brand.name} ${brand.labels.learning}`,
    url: absoluteSiteUrl("/learn"),
    description: "Premium cigar education that welcomes beginners and reveals greater depth as collectors grow.",
    isPartOf: { "@id": `${siteUrl()}/#website` },
    hasPart: learningPages.slice(1).map((page) => ({
      "@type": "Article",
      name: page.name,
      url: absoluteSiteUrl(page.path),
      description: page.description,
      publisher: { "@id": `${siteUrl()}/#organization` },
    })),
  };
}

export function industryCollectionJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brand.name} ${brand.labels.industryHub}`,
    url: absoluteSiteUrl("/industry"),
    description: "Official premium cigar industry profiles, releases, announcements, packaging revisions, and corrections with visible source labels.",
    isPartOf: { "@id": `${siteUrl()}/#website` },
    publisher: { "@id": `${siteUrl()}/#organization` },
  };
}
