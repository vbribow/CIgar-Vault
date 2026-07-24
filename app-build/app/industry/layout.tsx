import { SeoJsonLd } from "@/components/seo-json-ld";
import { industryCollectionJsonLd } from "@/lib/seo";

export default function IndustryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SeoJsonLd data={industryCollectionJsonLd()} />
      {children}
    </>
  );
}
