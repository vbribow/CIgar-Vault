export type FounderRecord={user_id:string;kind:string;record_id:string;updated_at?:string};
export type FounderEvent={user_id:string;event_type:string;created_at:string;properties?:Record<string,string>};
export function buildFounderMetrics(profileUserIds:string[],records:FounderRecord[],events:FounderEvent[]){
  const users=new Set([...profileUserIds,...records.map(row=>row.user_id),...events.map(row=>row.user_id)]);
  const count=(userId:string,kind:string)=>records.filter(row=>row.user_id===userId&&row.kind===kind).length;
  const hasEvent=(userId:string,type:string)=>events.some(event=>event.user_id===userId&&event.event_type===type);
  const rows=[...users].map(userId=>{const inventory=count(userId,"inventory");return{userId,inventory,imported:inventory>0,activated:inventory>=20,smoked:count(userId,"smokes")>0,reportViewed:hasEvent(userId,"insurance-report-viewed")}});
  const total=rows.length;const percent=(value:number)=>total?Math.round(value/total*100):0;
  const imported=rows.filter(row=>row.imported).length,activated=rows.filter(row=>row.activated).length,smoked=rows.filter(row=>row.smoked).length,reportViewed=rows.filter(row=>row.reportViewed).length;
  const unique=(type:string)=>new Set(events.filter(event=>event.event_type===type).map(event=>event.user_id)).size;const upgradeImpressions=unique("upgrade-impression"),upgradeClicks=unique("upgrade-clicked"),pricingViews=unique("pricing-viewed");
  return{total,imported,activated,smoked,reportViewed,inventoryLots:records.filter(row=>row.kind==="inventory").length,upgradeImpressions,upgradeClicks,pricingViews,upgradeClickRate:upgradeImpressions?Math.round(upgradeClicks/upgradeImpressions*100):0,conversion:{imported:percent(imported),activated:percent(activated),smoked:percent(smoked),reportViewed:percent(reportViewed)}};
}
