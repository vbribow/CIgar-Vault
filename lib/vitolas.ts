export const standardVitolas = [
  "Belicoso", "Cañonazo", "Cañonazo Especial", "Campana", "Cazadores", "Churchill", "Corona", "Corona Doble",
  "Corona Extra", "Corona Gorda", "Corona Grande", "Coronita", "Culebra", "Dalia", "Diadema", "Double Corona",
  "Double Perfecto", "Double Robusto", "Double Toro", "Edmundo", "Especial", "Figurado", "Flying Pig", "Giant",
  "Gigante", "Gordo", "Gran Corona", "Gran Perfecto", "Gran Pirámide", "Gran Robusto", "Gran Toro", "Julieta No. 2",
  "Laguito No. 1", "Laguito No. 2", "Laguito No. 3", "Lancero", "Lonsdale", "Mareva", "Montesco", "Nub",
  "Panetela", "Perfecto", "Petit Belicoso", "Petit Corona", "Petit Edmundo", "Petit Lancero", "Petit Robusto",
  "Petit Salomón", "Piramide", "Presidente", "Prominente", "Robusto", "Robusto Extra", "Robusto Gordo",
  "Robusto Grande", "Rothschild", "Salomón", "Short Churchill", "Short Panetela", "Short Robusto", "Toro",
  "Toro Extra", "Toro Gordo", "Toro Grande", "Torpedo"
] as const;

export function vitolaOptions(catalogVitolas: string[] = []) {
  return [...new Set([...standardVitolas, ...catalogVitolas].map((value) => value.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}
