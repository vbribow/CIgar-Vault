import type { MetadataRoute } from "next";
import { loadPublicIndustry } from "@/lib/industry-public";
import { absoluteSiteUrl, publicStaticPages } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = publicStaticPages.map((page) => ({
    url: absoluteSiteUrl(page.path),
  }));

  try {
    const { profiles } = await loadPublicIndustry();
    return [
      ...staticEntries,
      ...profiles.map((profile) => ({
        url: absoluteSiteUrl(`/industry/${profile.slug}`),
        lastModified: new Date(profile.publishedAt),
      })),
    ];
  } catch {
    return staticEntries;
  }
}
