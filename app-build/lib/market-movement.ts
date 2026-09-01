import type { Valuation } from "./types";
import { isVerifiedCompletedSale, marketEvidenceType } from "./valuation-evidence";

export type MarketMovementSeries = "Verified completed sale" | "Observed asking price" | "Retail consensus value" | "Estimated market range";
export type MarketMovement={
  direction:"Up"|"Down"|"Level"|"Developing";
  mode:"Trend"|"Same-month comparison"|"Developing";
  evidenceType?:MarketMovementSeries;
  latest?:number;
  previous?:number;
  changePercent?:number;
  latestDate?:string;
  previousDate?:string;
  observationCount:number;
  monthCount:number;
  sourceCount:number;
  confidence:"Documented"|"Developing"|"Insufficient";
  summary:string;
};

type Observation={date:string;value:number;sourceUrl:string;type:MarketMovementSeries};
const priority:MarketMovementSeries[]=["Verified completed sale","Observed asking price","Retail consensus value","Estimated market range"];
const median=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);const middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2};
const dollars=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);

function observationsFor(value:Valuation):Observation[]{
  if(value.invalidatedAt)return[];
  const observations:Observation[]=[];
  if(isVerifiedCompletedSale(value))observations.push({date:value.lastSaleDate!,value:value.lastSaleValue!,sourceUrl:value.lastSaleSourceUrl!,type:"Verified completed sale"});
  if(value.askingPrice!==undefined&&value.askingPriceSourceUrl)observations.push({date:value.valuationDate,value:value.askingPrice,sourceUrl:value.askingPriceSourceUrl,type:"Observed asking price"});
  const evidenceType=marketEvidenceType(value);
  if(value.marketValue!==undefined&&value.sourceUrl&&(evidenceType==="Retail consensus value"||evidenceType==="Estimated market range"))observations.push({date:value.valuationDate,value:value.marketValue,sourceUrl:value.sourceUrl,type:evidenceType});
  return observations;
}

/** Compare exact-identity prices only across different dates and within one evidence category. */
export function exactMarketMovement(valuations:Valuation[]):MarketMovement{
  const observations=valuations.flatMap(observationsFor);
  if(!observations.length)return{direction:"Developing",mode:"Developing",observationCount:0,monthCount:0,sourceCount:0,confidence:"Insufficient",summary:"No dated, linked exact-identity market observation is documented yet."};
  const series=priority.map(type=>({type,items:observations.filter(item=>item.type===type)}));
  const selected=series.find(item=>new Set(item.items.map(value=>value.date.slice(0,7))).size>=2)
    ??series.find(item=>item.items.length>=2)
    ??series.find(item=>item.items.length===1)!;
  const months=[...new Set(selected.items.map(value=>value.date.slice(0,7)))].sort();
  const sources=new Set(selected.items.map(value=>value.sourceUrl));
  if(months.length<2){
    const values=selected.items.map(value=>value.value);
    if(values.length>=2){
      const low=Math.min(...values),high=Math.max(...values);
      return{direction:"Developing",mode:"Same-month comparison",evidenceType:selected.type,latest:high,previous:low,latestDate:months[0],previousDate:months[0],observationCount:values.length,monthCount:1,sourceCount:sources.size,confidence:sources.size>=2?"Documented":"Developing",summary:`${values.length} ${selected.type.toLowerCase()} observations range from ${dollars(low)} to ${dollars(high)} during ${months[0]}. This is a monthly price comparison, not a market trend.`};
    }
    return{direction:"Developing",mode:"Developing",evidenceType:selected.type,latest:selected.items[0].value,latestDate:months[0],observationCount:1,monthCount:1,sourceCount:sources.size,confidence:"Developing",summary:`One dated ${selected.type.toLowerCase()} observation is documented; a trend requires a like-for-like observation from a different month.`};
  }
  const previousDate=months.at(-2)!,latestDate=months.at(-1)!;
  const previous=median(selected.items.filter(value=>value.date.startsWith(previousDate)).map(value=>value.value));
  const latest=median(selected.items.filter(value=>value.date.startsWith(latestDate)).map(value=>value.value));
  if(previous===0)return{direction:"Developing",mode:"Developing",evidenceType:selected.type,latest,previous,latestDate,previousDate,observationCount:selected.items.length,monthCount:months.length,sourceCount:sources.size,confidence:"Developing",summary:"The earlier monthly median is zero, so a percentage movement would be misleading."};
  const changePercent=Math.round((latest-previous)/previous*1000)/10;
  const direction=changePercent>1?"Up":changePercent< -1?"Down":"Level";
  const movement=direction==="Level"?"held broadly level":direction==="Up"?"moved upward":"moved downward";
  return{direction,mode:"Trend",evidenceType:selected.type,latest,previous,changePercent,latestDate,previousDate,observationCount:selected.items.length,monthCount:months.length,sourceCount:sources.size,confidence:sources.size>=2?"Documented":"Developing",summary:`Monthly median ${selected.type.toLowerCase()} observations ${movement} ${Math.abs(changePercent)}% between ${previousDate} and ${latestDate}.`};
}
