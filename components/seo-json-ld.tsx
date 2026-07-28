import { brand } from "@/lib/brand";

export function SeoJsonLd({ data }: { data: Record<string, unknown> }) {
  if (brand.isPreview) return null;
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
