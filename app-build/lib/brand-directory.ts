export type BrandIdentityEvidence = {
  depth: "Identity only";
  sourceName: string;
  sourceUrl: string;
  checkedAt: string;
};

export type CigarBrand = {
  name: string;
  region: "Cuba" | "Dominican Republic" | "Nicaragua" | "Honduras" | "United States" | "Other";
  segment: "Habanos" | "Boutique" | "Established";
  evidence?: BrandIdentityEvidence;
};

const cuban = ["Bolívar", "Cohiba", "Cuaba", "Diplomáticos", "El Rey del Mundo", "Fonseca", "H. Upmann", "Hoyo de Monterrey", "José L. Piedra", "Juan López", "La Flor de Cano", "La Gloria Cubana", "Montecristo", "Partagás", "Por Larrañaga", "Punch", "Quai d'Orsay", "Quintero", "Rafael González", "Ramón Allones", "Romeo y Julieta", "Saint Luis Rey", "San Cristóbal de La Habana", "Sancho Panza", "Trinidad", "Vegas Robaina", "Vegueros"];
const dominican = ["Aging Room", "Arturo Fuente", "Ashton", "AVO", "Casa de Garcia", "Casa Fuente", "Cohiba Red Dot", "Cuesta-Rey", "Davidoff", "Diamond Crown", "E.P. Carrillo", "El Septimo", "Ferio Tego", "Fuente / Padrón", "God of Fire", "La Aurora", "La Flor Dominicana", "Macanudo", "Montecristo (Dominican)", "Patoro", "PDR", "Quesada", "Room101", "Royal Danish", "VegaFina", "Villiger"];
const nicaraguan = ["A.J. Fernandez", "Aganorsa Leaf", "Aladino", "Alec Bradley", "Black Label Trading Co.", "Brick House", "CAO", "Crowned Heads", "Drew Estate", "Dunbarton Tobacco & Trust", "Foundation", "Fratello", "HVC", "Illusione", "Joya de Nicaragua", "Kristoff", "Liga Privada", "Luciano", "My Father", "Nica Rustica", "Oliva", "Padrón", "Perdomo", "Plasencia", "Rocky Patel", "RoMa Craft", "San Cristobal", "Southern Draw", "Tatuaje", "Warped"];
const honduran = ["Alec & Bradley", "Asylum", "Camacho", "CLE", "C.L.E. Plus", "Eiroa", "Flor de Selva", "Punch (Honduran)", "Rocky Patel (Honduran)", "Saint Luis Rey (Honduran)", "Villazon"];
const american = ["Aganorsa Rare Leaf", "All Saints", "Artista", "Cavalier Genève", "Dapper", "Dissident", "Espinosa", "Gran Habano", "Gurkha", "Hermanos de Armas (HDA Cigars)", "Jake Wyatt", "La Palina", "Protocol", "Recluse", "Serino", "Viaje"];
const other = ["7-20-4", "Adventura", "Amendola Family Cigar Co.", "Apostate", "Avowed", "Balmoral", "Black Works Studio", "Bluebonnets", "Bongani", "Caldwell Cigar Co.", "Casa Turrent", "Casdagli", "Cigar Clowns", "Cohiba (Brazil)", "Crux", "Daniel Marshall", "De Olifant", "Domain", "Don Pepin Garcia", "Drew Estate Acid", "El Mago", "Emperors Cut", "Fermin Perez", "Fosforo", "Freud Cigar Co.", "GTO Dominican Cigars", "Howard G Cigars", "J.C. Newman", "Kafie 1901", "Konscious Cigars", "La Galera", "Lampert", "L'Atelier", "Leaf by Oscar", "Lost & Found", "Maya Selva", "Meerapfel", "Nub", "Oscar Valladares", "Patina", "Powstanie", "Principle", "Rodriguez Cigars", "Rojas", "Saga", "Somm", "Stolen Throne", "Toscano", "United Cigars", "Valacari", "West Tampa Tobacco Co.", "Zaharoff", "Zino"];

const boutique = new Set(["Adventura", "Aging Room", "All Saints", "Amendola Family Cigar Co.", "Apostate", "Artista", "Avowed", "Black Label Trading Co.", "Black Works Studio", "Bluebonnets", "Caldwell Cigar Co.", "Casdagli", "Cavalier Genève", "Cigar Clowns", "Crowned Heads", "Crux", "Dapper", "Dissident", "Domain", "Dunbarton Tobacco & Trust", "El Mago", "Emperors Cut", "Fermin Perez", "Ferio Tego", "Fosforo", "Foundation", "Fratello", "Freud Cigar Co.", "GTO Dominican Cigars", "Hermanos de Armas (HDA Cigars)", "Howard G Cigars", "HVC", "Illusione", "Kafie 1901", "Konscious Cigars", "Kristoff", "Lampert", "L'Atelier", "Lost & Found", "Luciano", "Patina", "Powstanie", "Principle", "Protocol", "Recluse", "Rodriguez Cigars", "Rojas", "RoMa Craft", "Serino", "Somm", "Southern Draw", "Stolen Throne", "Tatuaje", "Valacari", "Viaje", "Warped", "West Tampa Tobacco Co.", "Zaharoff"]);

export const boutiqueDirectorySource = {
  name: "Cigar Coop · PCA 2026 Big Board",
  url: "https://cigar-coop.com/pca-2026-the-big-board",
  checkedAt: "2026-08-12",
} as const;

// These identities are documented without inferring a headquarters, factory,
// blend, or cigar-level fact. Those details remain research-on-demand fields.
const identityOnlyBoutiques: CigarBrand[] = [
  "Artesano del Tobacco", "ATL Cigar Co.", "Big Sky Cigar Co.", "Blackbird Cigar Co.",
  "Black Star Line Cigars", "Bocock Brothers", "Casa 1910", "Casa Cuevas", "Curivari",
  "DBL Cigars", "Definition Cigars", "Drunk Chicken Cigars", "EGM Cigars", "Esteban Carreras",
  "Hiram & Solomon", "Hooten Young", "J. Sann & Son", "La Barba", "Lure Cigars", "Matilde",
  "Mayflower Cigars", "Micallef Cigars", "Oz Family Cigars", "Pariah Cigars", "Platinum Nova",
  "Selected Tobacco", "Sinistro", "Stallone Cigars", "Stoic Cigars", "Warfighter Tobacco",
  "Wildfire Cigar Co.",
].map((name) => ({
  name,
  region: "Other",
  segment: "Boutique",
  evidence: {
    depth: "Identity only",
    sourceName: boutiqueDirectorySource.name,
    sourceUrl: boutiqueDirectorySource.url,
    checkedAt: boutiqueDirectorySource.checkedAt,
  },
}));

function entries(names: string[], region: CigarBrand["region"]): CigarBrand[] { return names.map((name) => ({ name, region, segment: region === "Cuba" ? "Habanos" : boutique.has(name) ? "Boutique" : "Established" })); }

export const cigarBrands = [
  ...entries(cuban, "Cuba"), ...entries(dominican, "Dominican Republic"), ...entries(nicaraguan, "Nicaragua"),
  ...entries(honduran, "Honduras"), ...entries(american, "United States"), ...entries(other, "Other"),
  ...identityOnlyBoutiques,
].sort((a, b) => a.name.localeCompare(b.name));

export const habanosBrandSource = "https://www.habanos.com/en/the-habanos-brands-academia/";

const brandAliases = new Map([
  ["bolivar", "Bolívar"], ["ramon allones", "Ramón Allones"], ["avo", "AVO"],
  ["juan lopez", "Juan López"], ["partagas", "Partagás"], ["cohiba ambar", "Cohiba"],
  ["drew state", "Drew Estate"],
  ["hda", "Hermanos de Armas (HDA Cigars)"], ["hda cigars", "Hermanos de Armas (HDA Cigars)"],
  ["hermanos de armas", "Hermanos de Armas (HDA Cigars)"],
  ["atl", "ATL Cigar Co."], ["atl cigars", "ATL Cigar Co."],
  ["black star line", "Black Star Line Cigars"], ["dbl", "DBL Cigars"],
  ["hiram and solomon", "Hiram & Solomon"], ["oz family", "Oz Family Cigars"],
  ["rojas cigars", "Rojas"],
]);

function comparable(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[right.length];
}

export function canonicalBrand(value: string) {
  const trimmed = value.trim();
  const normalized = comparable(trimmed);
  const direct = brandAliases.get(normalized) || cigarBrands.find((brand) => comparable(brand.name) === normalized)?.name;
  if (direct) return direct;
  const close = cigarBrands.filter((brand) => {
    const candidate = comparable(brand.name);
    const distance = editDistance(normalized, candidate);
    return distance <= (Math.max(normalized.length, candidate.length) >= 9 ? 2 : 1) && distance / Math.max(normalized.length, candidate.length, 1) <= 0.22;
  });
  return close.length === 1 ? close[0].name : trimmed;
}

export function brandIdentityEvidence(value: string) {
  const canonical = canonicalBrand(value);
  return cigarBrands.find((brand) => brand.name === canonical)?.evidence;
}
