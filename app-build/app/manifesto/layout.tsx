import { SeoJsonLd } from "@/components/seo-json-ld";
import { hojaviaOrganizationJsonLd } from "@/lib/seo";

export default function ManifestoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SeoJsonLd data={hojaviaOrganizationJsonLd()} />
      {children}
    </>
  );
}
