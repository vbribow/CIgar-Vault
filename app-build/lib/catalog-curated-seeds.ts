import type { CatalogCigar } from "./types";

export const curatedCatalogSeeds: CatalogCigar[] = [
  {
    catalogId: "CAT-ARTURO-FUENTE-OPUSX-FORBIDDEN-X-EL-TRECE-MAGISTRAL-13",
    brand: "Arturo Fuente",
    line: "Fuente Fuente OpusX Forbidden X",
    vitola: "El Trece Magistral 13",
    country: "Dominican Republic",
    factory: "Tabacalera A. Fuente y Cía",
    releaseYear: 2025,
    edition: "Limited production",
    packaging: "Physical collector box observed with 24 cigars; several public retailer listings state 26. Treat box count as disputed and preserve the collector-confirmed lot quantity.",
    sourceUrl: "https://es.halfwheel.com/2025-new-cigars/",
    sourceName: "halfwheel 2025 release list",
    sourceType: "Expert",
    confidence: "Medium",
    verifiedAt: "2026-11-01",
    correctionNotes: "Do not normalize a photographed or collector-confirmed 24-count box to the repeated 26-count retailer claim.",
    researchStatus: "Developing record",
  },
];

export const photoIdentificationHints = curatedCatalogSeeds.map((item) =>
  `${item.brand} | ${item.line} | ${item.vitola} | aliases: Fuente El Trece Magistral, OpusX El Trece, El Trece Magistral 13 | ${item.packaging}`,
);
