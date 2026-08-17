export type FactoryMapCountry = {
  country: string;
  context: string;
  factories: string[];
};

// Archival transcription from the user-provided "Privada Cigar Club Factory Map,
// Version 1." The source is undated. These names are educational research leads,
// not verified product-level manufacturing assignments.
export const factoryMapCountries: FactoryMapCountry[] = [
  {
    country: "Nicaragua",
    context: "The map presents a large network of company-owned and partner factories. A Nicaraguan brand or tobacco component does not, by itself, identify the factory.",
    factories: [
      "Tabacalera A.J. Fernandez", "Plasencia Cigars S.A.", "La Zona", "Fábrica de Tabacos Joya de Nicaragua",
      "TABSA / Tabacos Valle de Jalapa", "Agrícola Ganadera Norteña / Aganorsa", "La Gran Fábrica Drew Estate",
      "STG Estelí", "Tabolisa / Oliva", "Fábrica de Tabacos Nica Sueño", "Lanuza Cigar Factory",
      "My Father Cigars S.A.", "Agroindustrial Nicaragüense de Tabacos", "La Corona Factory",
      "Tabacalera Pichardo / Luciano Tabacos", "Oveja Negra / Fábrica Oveja Negra", "American Caribbean Tobacco",
      "Rojas / Tabacalera Flor de San Luis", "San Lotano Factory", "Tabacalera Perdomo",
    ],
  },
  {
    country: "Dominican Republic",
    context: "The map shows both major vertically connected houses and factories that make cigars for outside brands. The band, brand owner, and factory may be three different names.",
    factories: [
      "Casa Carrillo / formerly Tabacalera La Alianza", "PDR Cigars", "Tabacalera William Ventura", "Tabacalera La Isla",
      "La Aurora Cigar Factory", "Kelner Boutique Factory", "General Cigar Dominicana / STG", "Tabacalera Palma",
      "Tabacos de Exportación / Quesada", "MATASA", "Cigars Davidoff / O.K. Cigars", "Tabacalera A. Fuente y Cia.",
      "Tabacalera de García / Altadis La Romana", "Charles Fairmorn", "De Los Reyes", "Tabacalera La Flor S.A.",
      "Tabacalera El Artista", "Tabacalera Las Lavas", "Kelner / Occidental Cigar Factory",
    ],
  },
  {
    country: "Honduras",
    context: "The source separates several Jamastrán, Danlí, and Copán-area operations. Country is useful context, but the exact facility still belongs to the individual line and release.",
    factories: [
      "Raíces Cubanas", "STG Danlí / HATSA", "Diadema Cigars de Honduras / Agroindustria LAEPE",
      "Fábrica de Puros Aladino at Las Lomas Jamastrán", "The C.L.E. Factory", "Tabacos de Oriente",
      "La Flor de Copán", "Oscar Valladares", "Tabacos Rancho Jamastrán", "Fábrica Centroamericana de Tabaco",
      "El Paraíso / Plasencia Honduras",
    ],
  },
  {
    country: "United States",
    context: "The map highlights Miami and Tampa production. A U.S. factory credit can apply to a particular line or period even when related production later moves elsewhere.",
    factories: ["El Titan de Bronze - Miami", "El Rey de los Habanos - Miami", "El Reloj / J.C. Newman - Tampa"],
  },
  {
    country: "Costa Rica",
    context: "The source identifies a contract-manufacturing center in Costa Rica. Hojavía treats every reported brand relationship as a lead until a dated product source confirms it.",
    factories: ["Tabacos de Costa Rica"],
  },
];

export const factoryRelationshipModels = [
  {
    name: "Vertically connected",
    meaning: "The company controls important parts of tobacco growing, preparation, blending, manufacturing, or distribution.",
    caution: "Vertical integration does not mean every leaf comes from one farm or every release uses one facility.",
  },
  {
    name: "Mixed production",
    meaning: "A company may make some cigars itself and direct other lines through partner factories.",
    caution: "The correct factory must be attached to the exact line, market, and production period.",
  },
  {
    name: "Partner or contract production",
    meaning: "The brand owner directs the product while another factory supplies tobacco knowledge, production teams, and quality systems.",
    caution: "Contract production is not lesser authorship and should never make the factory invisible.",
  },
] as const;

export const factoryMapQuestions = [
  "Who owns or stewards the brand name?",
  "Who blended or creatively directed this exact cigar?",
  "Which named factory made this line, vitola, market release, and year?",
  "Did the manufacturing relationship change over time?",
  "Is the source official, historical reporting, a retailer statement, or an undated map?",
  "What remains unresolved and should be shown as unknown?",
] as const;
