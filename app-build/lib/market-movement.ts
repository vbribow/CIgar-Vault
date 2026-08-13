import type { Valuation } from "./types";

const unitValue=(value:Valuation)=>value.marketValue??value.replacementValue;
export type MarketMovement={direction:"Up"|"Down"|"Level"|"Developing";latest?:number;previous?:number;changePercent?:number;latestDate?:string;previousDate?:string;observationCount:number;sourceCount:number;confidence:"Documented"|"Developing"|"Insufficient";summary:string};

export function exactMarketMovement(valuations:Valuation[]):MarketMovement{
  const observations=valuations.filter(value=>unitValue(value)!==undefined).sort((a,b)=>a.valuationDate.localeCompare(b.valuationDate));
  const latest=observations.at(-1),previous=observations.at(-2),latestValue=latest?unitValue(latest):undefined,previousValue=previous?unitValue(previous):undefined;
  const sources=new Set(observations.flatMap(value=>[value.sourceUrl,value.lastSaleSourceUrl,value.askingPriceSourceUrl].filter((item):item is string=>Boolean(item))));
  if(latestValue===undefined)return{direction:"Developing",observationCount:0,sourceCount:0,confidence:"Insufficient",summary:"No dated exact-identity market observation is documented yet."};
  if(previousValue===undefined||previousValue===0)return{direction:"Developing",latest:latestValue,latestDate:latest?.valuationDate,observationCount:observations.length,sourceCount:sources.size,confidence:sources.size?"Developing":"Insufficient",summary:"One dated value is documented; a trend requires another exact-identity observation."};
  const changePercent=Math.round((latestValue-previousValue)/previousValue*1000)/10;
  const direction=changePercent>1?"Up":changePercent< -1?"Down":"Level";
  const confidence=sources.size>=2&&observations.length>=2?"Documented":"Developing";
  const movement=direction==="Level"?"held broadly level":direction==="Up"?"moved upward":"moved downward";
  return{direction,latest:latestValue,previous:previousValue,changePercent,latestDate:latest?.valuationDate,previousDate:previous?.valuationDate,observationCount:observations.length,sourceCount:sources.size,confidence,summary:`Exact-identity observations ${movement} ${Math.abs(changePercent)}% between ${previous?.valuationDate} and ${latest?.valuationDate}.`};
}
