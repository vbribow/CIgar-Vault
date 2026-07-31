export type SingleSourceVitola={name:string;lengthInches:number;lengthMm:number;ringGauge:number;ringGaugeMm:number;perBox:number};
export type SingleSourceDossier={
  dossierId:string;
  status:"Draft — founder review required";
  organization:string;
  productLine:string;
  source:{title:string;url:string;publisher:string;sourceClass:"Official primary source — organization not yet verified in Hojavía";checkedAt:string};
  supportedClaims:Array<{field:string;value:string;scope:string}>;
  vitolas:SingleSourceVitola[];
  unresolved:string[];
};

export const opusXSingleSourcePilot:SingleSourceDossier={
  dossierId:"PILOT-ARTURO-FUENTE-OPUSX-PRIMARY-01",
  status:"Draft — founder review required",
  organization:"Arturo Fuente",
  productLine:"Fuente Fuente OpusX",
  source:{title:"Fuente Fuente Opus X",url:"https://arturofuente.com/our-cigars/opusx/ff-opusx/",publisher:"Arturo Fuente",sourceClass:"Official primary source — organization not yet verified in Hojavía",checkedAt:"2026-07-31"},
  supportedClaims:[
    {field:"Origin positioning",value:"Dominican puro",scope:"Official line-level claim; not independent verification of every production period."},
    {field:"Wrapper positioning",value:"Exclusive Fuente Fuente OpusX wrapper tobacco",scope:"Official line-level wording; seed, varietal, and exact farm parcel remain unstated."},
    {field:"Growing context",value:"Wrapper tobacco cultivated in the Dominican Republic at Chateau de la Fuente",scope:"Cultivation context only; it does not identify the rolling factory."},
    {field:"Published formats",value:"14 named vitolas with dimensions and box counts",scope:"Formats displayed on the source when checked; availability and packaging revisions remain date-sensitive."},
  ],
  vitolas:[
    {name:"Belicoso XXX",lengthInches:4.625,lengthMm:117,ringGauge:49,ringGaugeMm:19,perBox:42},
    {name:"PerfecXion No. 5",lengthInches:4.875,lengthMm:124,ringGauge:40,ringGaugeMm:16,perBox:42},
    {name:"PerfecXion No.4 Series X",lengthInches:5.125,lengthMm:130,ringGauge:43,ringGaugeMm:17,perBox:42},
    {name:"Robusto",lengthInches:5.25,lengthMm:133,ringGauge:50,ringGaugeMm:20,perBox:32},
    {name:"PerfecXion 77 Shark",lengthInches:5.5,lengthMm:140,ringGauge:52,ringGaugeMm:21,perBox:36},
    {name:"Super Belicoso",lengthInches:5.5,lengthMm:140,ringGauge:52,ringGaugeMm:21,perBox:29},
    {name:"Fuente Fuente",lengthInches:5.625,lengthMm:143,ringGauge:46,ringGaugeMm:18,perBox:32},
    {name:"Double Robusto",lengthInches:5.75,lengthMm:146,ringGauge:52,ringGaugeMm:21,perBox:42},
    {name:"PerfecXion X",lengthInches:6.25,lengthMm:160,ringGauge:48,ringGaugeMm:19,perBox:32},
    {name:"Petite Lancero",lengthInches:6.25,lengthMm:160,ringGauge:39,ringGaugeMm:15,perBox:32},
    {name:"PerfecXion No. 2",lengthInches:6.375,lengthMm:162,ringGauge:52,ringGaugeMm:21,perBox:29},
    {name:"Reserva D' Chateau",lengthInches:7,lengthMm:178,ringGauge:48,ringGaugeMm:19,perBox:32},
    {name:"Double Corona",lengthInches:7.625,lengthMm:194,ringGauge:49,ringGaugeMm:19,perBox:32},
    {name:"PerfecXion A",lengthInches:9.125,lengthMm:229,ringGauge:47,ringGaugeMm:18,perBox:20},
  ],
  unresolved:["Authorized Hojavía organization identity and contact","Exact rolling factory and production-period changes","Binder and filler leaf, seed, varietal, and farm details","Blender attribution","Release year and dated availability history","Current MSRP and market-specific pricing","Packaging revisions behind source-page asterisks"],
};

export function validateSingleSourceDossier(dossier:SingleSourceDossier){
  if(!dossier.source.url.startsWith("https://"))throw new Error("A direct HTTPS source is required");
  if(!dossier.vitolas.length)throw new Error("At least one source-supported vitola is required");
  const exact=new Set<string>();
  for(const vitola of dossier.vitolas){
    if(!vitola.name||vitola.lengthInches<=0||vitola.ringGauge<=0||vitola.perBox<=0)throw new Error("Every vitola requires a name, dimensions, and box count");
    const key=`${vitola.name.toLocaleLowerCase()}|${vitola.lengthInches}|${vitola.ringGauge}`;
    if(exact.has(key))throw new Error(`Duplicate exact vitola: ${vitola.name}`);
    exact.add(key);
  }
  if(!dossier.unresolved.length)throw new Error("A single-source dossier must disclose unresolved facts");
  return dossier;
}
