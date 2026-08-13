export type SharedBrandEntity = { label:string; market:string; company:string; note:string };
export type SharedBrandBoundary = { sharedName:string; entities:readonly SharedBrandEntity[] };

/** Commercial names with legally and operationally distinct Cuban and New World cigar entities. */
export const sharedBrandBoundaries:readonly SharedBrandBoundary[]=[
  {sharedName:"Cohiba",entities:[
    {label:"Cohiba",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"Cohiba Red Dot",market:"New World / United States",company:"Separate non-Cuban commercial cigar entity",note:"Do not merge with the Cuban catalog"},
    {label:"Cohiba (Brazil)",market:"Brazil / selected markets",company:"Separate non-Cuban product identity",note:"Keep its manufacturer and releases distinct"},
  ]},
  {sharedName:"Montecristo",entities:[
    {label:"Montecristo",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"Montecristo (Dominican)",market:"New World",company:"Separate non-Cuban commercial cigar entity",note:"Exact factory varies by product and period"},
  ]},
  {sharedName:"Romeo y Julieta",entities:[
    {label:"Romeo y Julieta",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"Romeo y Julieta (New World)",market:"New World / United States portfolio",company:"Altadis U.S.A.",note:"Separate company; exact factory and country remain release facts"},
  ]},
  {sharedName:"H. Upmann",entities:[
    {label:"H. Upmann",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"H. Upmann (New World)",market:"New World / United States portfolio",company:"Altadis U.S.A.",note:"Separate company; exact factory and country remain release facts"},
  ]},
  {sharedName:"Trinidad",entities:[
    {label:"Trinidad",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"Trinidad (New World)",market:"New World / United States portfolio",company:"Altadis U.S.A.",note:"Separate company; exact factory and country remain release facts"},
  ]},
  {sharedName:"Partagás",entities:[
    {label:"Partagás",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"Partagas (New World)",market:"New World / United States portfolio",company:"Separate non-Cuban commercial cigar entity",note:"Ownership, factory, and release evidence remain separate"},
  ]},
  {sharedName:"Hoyo de Monterrey",entities:[
    {label:"Hoyo de Monterrey",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"Hoyo de Monterrey (New World)",market:"New World / United States portfolio",company:"Separate non-Cuban commercial cigar entity",note:"Ownership, factory, and release evidence remain separate"},
  ]},
  {sharedName:"Bolívar",entities:[
    {label:"Bolívar",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"Bolivar (New World)",market:"New World / United States portfolio",company:"Separate non-Cuban commercial cigar entity",note:"Ownership, factory, and release evidence remain separate"},
  ]},
  {sharedName:"Fonseca",entities:[
    {label:"Fonseca",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"Fonseca (New World)",market:"New World / United States portfolio",company:"Separate non-Cuban commercial cigar entity",note:"Current ownership and factory require exact release evidence"},
  ]},
  {sharedName:"La Gloria Cubana",entities:[
    {label:"La Gloria Cubana",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"La Gloria Cubana (New World)",market:"New World / United States portfolio",company:"Separate non-Cuban commercial cigar entity",note:"Ownership, factory, and release evidence remain separate"},
  ]},
  {sharedName:"El Rey del Mundo",entities:[
    {label:"El Rey del Mundo",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"El Rey del Mundo (New World)",market:"New World / United States portfolio",company:"Separate non-Cuban commercial cigar entity",note:"Ownership, factory, and release evidence remain separate"},
  ]},
  {sharedName:"Sancho Panza",entities:[
    {label:"Sancho Panza",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"Sancho Panza (New World)",market:"New World / United States portfolio",company:"Separate non-Cuban commercial cigar entity",note:"Ownership, factory, and release evidence remain separate"},
  ]},
  {sharedName:"Punch",entities:[
    {label:"Punch",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"Punch (Honduran)",market:"New World",company:"Separate non-Cuban commercial cigar entity",note:"Do not inherit Cuban origin or catalog data"},
  ]},
  {sharedName:"Saint Luis Rey",entities:[
    {label:"Saint Luis Rey",market:"Cuba / Habanos",company:"Cuban trademark administered through Habanos S.A.",note:"Cuban portfolio identity"},
    {label:"Saint Luis Rey (Honduran)",market:"New World",company:"Separate non-Cuban commercial cigar entity",note:"Do not inherit Cuban origin or catalog data"},
  ]},
];

export function sharedBrandBoundary(value:string){
  const normalized=value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  return sharedBrandBoundaries.find(boundary=>boundary.entities.some(entity=>entity.label.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()===normalized));
}
