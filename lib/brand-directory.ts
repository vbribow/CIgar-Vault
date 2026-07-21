export type CigarBrand = { name: string; region: "Cuba" | "Dominican Republic" | "Nicaragua" | "Honduras" | "United States" | "Other"; segment: "Habanos" | "Boutique" | "Established" };

const cuban = ["Bolívar", "Cohiba", "Cuaba", "Diplomáticos", "El Rey del Mundo", "Fonseca", "H. Upmann", "Hoyo de Monterrey", "José L. Piedra", "Juan López", "La Flor de Cano", "La Gloria Cubana", "Montecristo", "Partagás", "Por Larrañaga", "Punch", "Quai d'Orsay", "Quintero", "Rafael González", "Ramón Allones", "Romeo y Julieta", "Saint Luis Rey", "San Cristóbal de La Habana", "Sancho Panza", "Trinidad", "Vegas Robaina", "Vegueros"];
const dominican = ["Aging Room", "Arturo Fuente", "Ashton", "AVO", "Casa de Garcia", "Casa Fuente", "Cohiba Red Dot", "Cuesta-Rey", "Davidoff", "Diamond Crown", "E.P. Carrillo", "El Septimo", "Ferio Tego", "Fuente / Padrón", "God of Fire", "La Aurora", "La Flor Dominicana", "Macanudo", "Montecristo (Dominican)", "Patoro", "PDR", "Quesada", "Room101", "Royal Danish", "VegaFina", "Villiger"];
const nicaraguan = ["A.J. Fernandez", "Aganorsa Leaf", "Aladino", "Alec Bradley", "Black Label Trading Co.", "Brick House", "CAO", "Crowned Heads", "Drew Estate", "Dunbarton Tobacco & Trust", "Foundation", "Fratello", "HVC", "Illusione", "Joya de Nicaragua", "Kristoff", "Liga Privada", "Luciano", "My Father", "Nica Rustica", "Oliva", "Padrón", "Perdomo", "Plasencia", "Rocky Patel", "RoMa Craft", "San Cristobal", "Southern Draw", "Tatuaje", "Warped"];
const honduran = ["Alec & Bradley", "Asylum", "Camacho", "CLE", "C.L.E. Plus", "Eiroa", "Flor de Selva", "Punch (Honduran)", "Rocky Patel (Honduran)", "Saint Luis Rey (Honduran)", "Villazon"];
const american = ["Aganorsa Rare Leaf", "All Saints", "Artista", "Cavalier Genève", "Dapper", "Dissident", "Espinosa", "Gran Habano", "Gurkha", "Jake Wyatt", "La Palina", "Protocol", "Recluse", "Serino", "Viaje"];
const other = ["7-20-4", "Adventura", "Amendola Family Cigar Co.", "Apostate", "Avowed", "Balmoral", "Black Works Studio", "Bluebonnets", "Bongani", "Caldwell Cigar Co.", "Casa Turrent", "Casdagli", "Cigar Clowns", "Cohiba (Brazil)", "Crux", "Daniel Marshall", "De Olifant", "Domain", "Don Pepin Garcia", "Drew Estate Acid", "El Mago", "Emperors Cut", "Fermin Perez", "Fosforo", "Freud Cigar Co.", "GTO Dominican Cigars", "Howard G Cigars", "J.C. Newman", "Kafie 1901", "Konscious Cigars", "La Galera", "Lampert", "L'Atelier", "Leaf by Oscar", "Lost & Found", "Maya Selva", "Meerapfel", "Nub", "Oscar Valladares", "Patina", "Powstanie", "Principle", "Rodriguez Cigars", "Rojas", "Saga", "Somm", "Stolen Throne", "Toscano", "United Cigars", "Valacari", "West Tampa Tobacco Co.", "Zaharoff", "Zino"];

const boutique = new Set(["Adventura", "Aging Room", "All Saints", "Amendola Family Cigar Co.", "Apostate", "Artista", "Avowed", "Black Label Trading Co.", "Black Works Studio", "Bluebonnets", "Caldwell Cigar Co.", "Casdagli", "Cavalier Genève", "Cigar Clowns", "Crowned Heads", "Crux", "Dapper", "Dissident", "Domain", "Dunbarton Tobacco & Trust", "El Mago", "Emperors Cut", "Fermin Perez", "Ferio Tego", "Fosforo", "Foundation", "Fratello", "Freud Cigar Co.", "GTO Dominican Cigars", "Howard G Cigars", "HVC", "Illusione", "Kafie 1901", "Konscious Cigars", "Kristoff", "Lampert", "L'Atelier", "Lost & Found", "Luciano", "Patina", "Powstanie", "Principle", "Protocol", "Recluse", "Rodriguez Cigars", "Rojas", "RoMa Craft", "Serino", "Somm", "Southern Draw", "Stolen Throne", "Tatuaje", "Valacari", "Viaje", "Warped", "West Tampa Tobacco Co.", "Zaharoff"]);

function entries(names: string[], region: CigarBrand["region"]): CigarBrand[] { return names.map((name) => ({ name, region, segment: region === "Cuba" ? "Habanos" : boutique.has(name) ? "Boutique" : "Established" })); }

export const cigarBrands = [
  ...entries(cuban, "Cuba"), ...entries(dominican, "Dominican Republic"), ...entries(nicaraguan, "Nicaragua"),
  ...entries(honduran, "Honduras"), ...entries(american, "United States"), ...entries(other, "Other"),
].sort((a, b) => a.name.localeCompare(b.name));

export const habanosBrandSource = "https://www.habanos.com/en/the-habanos-brands-academia/";

const brandAliases = new Map([
  ["bolivar", "Bolívar"], ["ramon allones", "Ramón Allones"], ["avo", "AVO"],
  ["juan lopez", "Juan López"], ["partagas", "Partagás"], ["cohiba ambar", "Cohiba"],
]);

export function canonicalBrand(value: string) {
  return brandAliases.get(value.trim().toLocaleLowerCase()) || cigarBrands.find((brand) => brand.name.toLocaleLowerCase() === value.trim().toLocaleLowerCase())?.name || value.trim();
}
