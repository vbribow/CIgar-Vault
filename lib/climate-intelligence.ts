import type { ClimateProfileId,Humidor,HumidorReading } from "./types";

export type ClimateProfile={
  id:ClimateProfileId;
  label:string;
  authority:string;
  detail:string;
  targetTempF:number;
  minTempF:number;
  maxTempF:number;
  targetHumidity:number;
  minHumidity:number;
  maxHumidity:number;
};

export const climateProfiles:ClimateProfile[]=[
  {id:"new-world",label:"New World",authority:"Published storage guidance",detail:"A conservative starting profile for most premium cigars made outside Cuba.",targetTempF:67,minTempF:65,maxTempF:70,targetHumidity:67,minHumidity:65,maxHumidity:69},
  {id:"habanos",label:"Habanos",authority:"Official Habanos standard",detail:"The official Habanos storage and aging range.",targetTempF:63,minTempF:61,maxTempF:64,targetHumidity:67,minHumidity:65,maxHumidity:70},
  {id:"mixed",label:"Mixed collection",authority:"Cedriva starting guidance",detail:"A practical compromise for one humidor holding Habanos and New World cigars.",targetTempF:67,minTempF:65,maxTempF:69,targetHumidity:67,minHumidity:65,maxHumidity:69},
  {id:"aging-cellar",label:"Aging cellar",authority:"Cedriva starting guidance",detail:"A conservative, slightly drier profile for deliberate long-term aging and periodic tasting.",targetTempF:66,minTempF:64,maxTempF:68,targetHumidity:65,minHumidity:63,maxHumidity:67},
  {id:"custom",label:"Custom",authority:"Collector controlled",detail:"Use your own researched targets and tolerances.",targetTempF:68,minTempF:65,maxTempF:72,targetHumidity:67,minHumidity:62,maxHumidity:72},
];

export const climateProfile=(id:ClimateProfileId|undefined)=>climateProfiles.find(profile=>profile.id===id)??climateProfiles[4];

type IssueKind="warm-humid"|"too-warm"|"too-cool"|"too-humid"|"too-dry";
const issueKinds=(humidor:Humidor,reading:HumidorReading):IssueKind[]=>{
  const warm=reading.temperatureF>humidor.maxTempF;
  const humid=reading.humidity>humidor.maxHumidity;
  const kinds:IssueKind[]=[];
  if(warm&&humid)kinds.push("warm-humid");
  if(warm)kinds.push("too-warm");
  if(reading.temperatureF<humidor.minTempF)kinds.push("too-cool");
  if(humid)kinds.push("too-humid");
  if(reading.humidity<humidor.minHumidity)kinds.push("too-dry");
  return kinds;
};

const issueCopy:Record<IssueKind,{label:string;consequence:string;action:string}>={
  "warm-humid":{label:"Warm and humid",consequence:"Sustained warmth plus excess moisture creates the highest combined concern for mold, swelling, difficult combustion, and tobacco-beetle activity.",action:"Lower the room temperature first, inspect the collection, and correct humidity gradually."},
  "too-warm":{label:"Above temperature range",consequence:"Prolonged warmth increases biological activity and becomes more concerning when humidity is also elevated.",action:"Move the humidor away from heat and sunlight, verify the sensor, and lower room temperature without refrigerating the cigars."},
  "too-cool":{label:"Below temperature range",consequence:"Cool storage is not automatically damaging, but it can complicate moisture control and create condensation risk during rapid warming.",action:"Warm the room gradually and avoid moving cold cigars directly into warm, humid air."},
  "too-humid":{label:"Above humidity range",consequence:"Tobacco can swell, draws can tighten, relights can increase, and sustained moisture raises mold concern.",action:"Verify the sensor and seal, remove excess humidification if appropriate, and let RH return gradually."},
  "too-dry":{label:"Below humidity range",consequence:"Wrappers can become brittle while cigars burn faster, hotter, and harsher; prolonged severe dryness may permanently diminish aroma.",action:"Improve the seal or humidification capacity and rehumidify slowly rather than flooding the enclosure."},
};

const rounded=(value:number)=>Math.round(value*10)/10;

export function climateIntelligence(humidor:Humidor,readings:HumidorReading[],now=new Date()){
  const rows=readings.filter(reading=>reading.humidorId===humidor.humidorId&&Number.isFinite(new Date(reading.recordedAt).getTime())).sort((a,b)=>new Date(a.recordedAt).getTime()-new Date(b.recordedAt).getTime());
  const latest=rows.at(-1);
  const latestKinds=latest?issueKinds(humidor,latest):[];
  const primaryKind=latestKinds[0];
  const primary=primaryKind?issueCopy[primaryKind]:undefined;
  const consecutive:HumidorReading[]=[];
  if(primaryKind){
    for(let index=rows.length-1;index>=0;index--){
      if(!issueKinds(humidor,rows[index]).includes(primaryKind))break;
      consecutive.unshift(rows[index]);
    }
  }
  const firstAt=consecutive[0]?new Date(consecutive[0].recordedAt).getTime():undefined;
  const latestAt=latest?new Date(latest.recordedAt).getTime():undefined;
  const observedSpanHours=firstAt!==undefined&&latestAt!==undefined?Math.max(0,(latestAt-firstAt)/3_600_000):0;
  const recentTailHours=latestAt===undefined?0:Math.min(6,Math.max(0,(now.getTime()-latestAt)/3_600_000));
  const observedDurationHours=primaryKind?rounded(observedSpanHours+recentTailHours):0;
  const sustained=Boolean(primaryKind&&(observedDurationHours>=24||(consecutive.length>=3&&observedSpanHours>=6)));
  const developing=Boolean(primaryKind&&!sustained&&consecutive.length>=2);
  const estimated={tooWarm:0,tooCool:0,tooHumid:0,tooDry:0,warmHumid:0};
  rows.forEach((reading,index)=>{
    const at=new Date(reading.recordedAt).getTime();
    const next=index<rows.length-1?new Date(rows[index+1].recordedAt).getTime():now.getTime();
    const hours=Math.min(6,Math.max(0,Math.min(now.getTime(),next)-at)/3_600_000);
    const kinds=issueKinds(humidor,reading);
    if(kinds.includes("too-warm"))estimated.tooWarm+=hours;
    if(kinds.includes("too-cool"))estimated.tooCool+=hours;
    if(kinds.includes("too-humid"))estimated.tooHumid+=hours;
    if(kinds.includes("too-dry"))estimated.tooDry+=hours;
    if(kinds.includes("warm-humid"))estimated.warmHumid+=hours;
  });
  const exposureHours=Object.fromEntries(Object.entries(estimated).map(([key,value])=>[key,rounded(value)])) as typeof estimated;
  const state=!latest?"No data":!primaryKind?"Stable":sustained?"Sustained exposure":developing?"Developing trend":"Brief excursion";
  const summary=!latest
    ?"No climate reading is available."
    :!primary
      ?`Latest reading is inside the collector-selected ${humidor.minTempF}–${humidor.maxTempF}°F and ${humidor.minHumidity}–${humidor.maxHumidity}% RH ranges.`
      :`${primary.label} across ${consecutive.length} observed reading${consecutive.length===1?"":"s"}${observedDurationHours?` over approximately ${observedDurationHours} monitored hour${observedDurationHours===1?"":"s"}`:""}.`;
  return{rows,latest,profile:climateProfile(humidor.climateProfile),state,summary,primaryKind,consequence:primary?.consequence,action:primary?.action,consecutiveReadings:consecutive.length,observedDurationHours,sustained,exposureHours};
}
