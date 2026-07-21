export type CigarBrand = { name: string; region: "Cuba" | "Dominican Republic" | "Nicaragua" | "Honduras" | "United States" | "Other" };

const cuban = ["Bolívar", "Cohiba", "Cuaba", "Diplomáticos", "El Rey del Mundo", "Fonseca", "H. Upmann", "Hoyo de Monterrey", "José L. Piedra", "Juan López", "La Flor de Cano", "La Gloria Cubana", "Montecristo", "Partagás", "Por Larrañaga", "Punch", "Quai d'Orsay", "Quintero", "Rafael González", "Ramón Allones", "Romeo y Julieta", "Saint Luis Rey", "San Cristóbal de La Habana", "Sancho Panza", "Trinidad", "Vegas Robaina", "Vegueros"];
const dominican = ["Aging Room", "Arturo Fuente", "Ashton", "AVO", "Casa de Garcia", "Casa Fuente", "Cohiba Red Dot", "Cuesta-Rey", "Davidoff", "Diamond Crown", "E.P. Carrillo", "El Septimo", "Ferio Tego", "Fuente / Padrón", "God of Fire", "La Aurora", "La Flor Dominicana", "Macanudo", "Montecristo (Dominican)", "Patoro", "PDR", "Quesada", "Room101", "Royal Danish", "VegaFina", "Villiger"];
const nicaraguan = ["A.J. Fernandez", "Aganorsa Leaf", "Aladino", "Alec Bradley", "Black Label Trading Co.", "Brick House", "CAO", "Crowned Heads", "Drew Estate", "Dunbarton Tobacco & Trust", "Foundation", "Fratello", "HVC", "Illusione", "Joya de Nicaragua", "Kristoff", "Liga Privada", "Luciano", "My Father", "Nica Rustica", "Oliva", "Padrón", "Perdomo", "Plasencia", "Rocky Patel", "RoMa Craft", "San Cristobal", "Southern Draw", "Tatuaje", "Warped"];
const honduran = ["Alec & Bradley", "Asylum", "Camacho", "CLE", "C.L.E. Plus", "Eiroa", "Flor de Selva", "Punch (Honduran)", "Rocky Patel (Honduran)", "Saint Luis Rey (Honduran)", "Villazon"];
const american = ["Aganorsa Rare Leaf", "All Saints", "Artista", "Cavalier Genève", "Dapper", "Dissident", "Espinosa", "Gran Habano", "Gurkha", "Jake Wyatt", "La Palina", "Protocol", "Recluse", "Serino", "Viaje"];
const other = ["7-20-4", "Balmoral", "Bongani", "Casa Turrent", "Cohiba (Brazil)", "Daniel Marshall", "De Olifant", "Don Pepin Garcia", "Drew Estate Acid", "J.C. Newman", "La Galera", "Leaf by Oscar", "Maya Selva", "Meerapfel", "Nub", "Oscar Valladares", "Principle", "Rojas", "Saga", "Toscano", "United Cigars", "West Tampa Tobacco Co.", "Zino"];

function entries(names: string[], region: CigarBrand["region"]): CigarBrand[] { return names.map((name) => ({ name, region })); }

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
