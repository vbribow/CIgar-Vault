import type { InventoryItem } from "./types";

export type BoxFormat = {
  brand: string;
  product: string;
  match: string[];
  sizes: number[];
  sourceUrl: string;
  sourceLabel: string;
};

export const boxFormats: BoxFormat[] = [
  { brand: "Arturo Fuente", product: "OpusX PerfecXion No. 4", match: ["arturo fuente", "perfecxion no. 4"], sizes: [42], sourceUrl: "https://arturofuente.com/our-cigars/opusx/oro-oscuro/", sourceLabel: "Arturo Fuente" },
  { brand: "Arturo Fuente", product: "OpusX Double Robusto", match: ["arturo fuente", "opusx", "double robusto"], sizes: [42], sourceUrl: "https://arturofuente.com/our-cigars/opusx/oro-oscuro/", sourceLabel: "Arturo Fuente" },
  { brand: "Arturo Fuente", product: "Don Carlos Double Robusto", match: ["arturo fuente", "don carlos", "double robusto"], sizes: [25], sourceUrl: "https://arturofuente.com/our-cigars/don-carlos/", sourceLabel: "Arturo Fuente" },
  { brand: "La Flor Dominicana", product: "Andalusian Bull", match: ["la flor dominicana", "andalusian bull"], sizes: [10], sourceUrl: "https://www.laflordominicana.com/andalusian-bull", sourceLabel: "La Flor Dominicana" },
  { brand: "Liga Privada", product: "Único Serie Feral Flying Pig", match: ["liga privada", "feral flying pig"], sizes: [10], sourceUrl: "https://www.cigars.com/item/liga-privada-unico-serie/feral-flying-pig/LPUFP.html", sourceLabel: "Cigars.com" },
  { brand: "Diamond Crown", product: "Maximus Toro No. 4", match: ["diamond crown", "maximus", "toro no. 4"], sizes: [20], sourceUrl: "https://www.cigarsdirect.com/products/diamond-crown-maximus-toro-no-4", sourceLabel: "Cigars Direct" },
  { brand: "Davidoff", product: "Chefs Edition 2025", match: ["davidoff", "chefs edition"], sizes: [10], sourceUrl: "https://us.davidoffgeneva.com/discover/davidoff-chefs-edition-2025", sourceLabel: "Davidoff" },
  { brand: "Davidoff", product: "Grand Cru Toro", match: ["davidoff", "grand cru", "toro"], sizes: [25], sourceUrl: "https://us.davidoffgeneva.com/discover/our-products", sourceLabel: "Davidoff" },
  { brand: "Davidoff", product: "Aniversario No. 3", match: ["davidoff", "anniversario", "no. 3"], sizes: [10], sourceUrl: "https://us.davidoffgeneva.com/discover/our-products", sourceLabel: "Davidoff" },
  { brand: "Cohiba", product: "Siglo IV", match: ["cohiba", "siglo iv"], sizes: [25], sourceUrl: "https://www.habanos.com/wp-content/uploads/Catalogo_Subasta_Humidores1.pdf", sourceLabel: "Habanos S.A." },
  { brand: "Cohiba", product: "Siglo VI", match: ["cohiba", "siglo vi"], sizes: [25], sourceUrl: "https://www.habanos.com/wp-content/uploads/Catalogo_Subasta_Humidores1.pdf", sourceLabel: "Habanos S.A." },
  { brand: "Cohiba", product: "Robustos", match: ["cohiba", "robustos"], sizes: [25], sourceUrl: "https://www.habanos.com/wp-content/uploads/Catalogo_Subasta_Humidores1.pdf", sourceLabel: "Habanos S.A." },
  { brand: "Cohiba", product: "Coronas Especiales", match: ["cohiba", "corona especiales"], sizes: [25], sourceUrl: "https://www.habanos.com/wp-content/uploads/Catalogo_Subasta_Humidores1.pdf", sourceLabel: "Habanos S.A." },
  { brand: "Cohiba", product: "Maduro 5 Mágicos", match: ["cohiba", "maduro 5", "mágicos"], sizes: [10, 25], sourceUrl: "https://www.cgarsltd.co.uk/cohiba-maduro-magicos-cigar-box-p-6842.html", sourceLabel: "C.Gars Ltd" },
  { brand: "Cohiba", product: "Ámbar", match: ["cohiba", "ámbar"], sizes: [10], sourceUrl: "https://www.cigar-club.com/shop/cigars/regions/havanas/cohiba-cigars/la-linea-clasica/cohiba-ambar/", sourceLabel: "Cigar Club" },
  { brand: "Trinidad", product: "Vigía", match: ["trinidad", "vigía"], sizes: [12], sourceUrl: "https://www.habanos.com/en/news/vigia-una-nueva-referencia-exclusiva-de-trinidad-en/", sourceLabel: "Habanos S.A." },
  { brand: "Trinidad", product: "La Trova", match: ["trinidad", "la trova"], sizes: [12], sourceUrl: "https://www.cigars-of-cuba.com/La-Casa-Del-Habano/la-trova-cdh-box-of-12.html", sourceLabel: "Cigars of Cuba" },
  { brand: "Juan López", product: "Selección No. 2", match: ["juan lópez", "selección no. 2"], sizes: [25], sourceUrl: "https://cigar.triplec.cc/brand/juan-lopez/", sourceLabel: "Cigar Wiki catalog" },
  { brand: "Hoyo de Monterrey", product: "Epicure Especial", match: ["hoyo de monterrey", "epicure especial"], sizes: [10, 25], sourceUrl: "https://www.boe.es/boe/dias/2017/01/03/pdfs/BOE-A-2017-57.pdf", sourceLabel: "Spanish Official Gazette" },
];

function searchable(item: InventoryItem) {
  return `${item.brand} ${item.line} ${item.vitola}`.toLocaleLowerCase();
}

export function findBoxFormat(item: InventoryItem) {
  const value = searchable(item);
  return boxFormats.find((format) => format.match.every((part) => value.includes(part.toLocaleLowerCase())));
}
