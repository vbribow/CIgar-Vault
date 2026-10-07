export type FounderRecord={user_id:string;kind:string;record_id:string;updated_at?:string};
export type FounderEvent={user_id:string;event_type:string;created_at:string;properties?:Record<string,string>};
export type FounderMetricsOptions={invited?:number;excludedUserIds?:string[]};

const DAY=86_400_000;
export const meaningfulActivityDefinition="A saved inventory, collection, or smoke record, or an intentional report, Cigar Somm, pricing, or upgrade-intent action.";

export function buildFounderMetrics(profileUserIds:string[],records:FounderRecord[],events:FounderEvent[],options:FounderMetricsOptions={}){
  const excluded=new Set(options.excludedUserIds||[]);
  const users=new Set([...profileUserIds,...records.map(row=>row.user_id),...events.map(row=>row.user_id)].filter(userId=>!excluded.has(userId)));
  const userRows=[...users].map(userId=>{
    const owned=records.filter(row=>row.user_id===userId),activityEvents=events.filter(row=>row.user_id===userId);
    const inventory=owned.filter(row=>row.kind==="inventory").length;
    const hasEvent=(type:string)=>activityEvents.some(event=>event.event_type===type);
    const meaningfulDates=[...owned.filter(row=>["inventory","collections","smokes"].includes(row.kind)).map(row=>row.updated_at),...activityEvents.filter(event=>["insurance-report-viewed","cigar-somm-used","pricing-viewed","upgrade-clicked"].includes(event.event_type)).map(event=>event.created_at)].filter((value):value is string=>Boolean(value)).map(value=>new Date(value).getTime()).filter(Number.isFinite).sort((a,b)=>a-b);
    const first=meaningfulDates[0],returnedWithin=(minimumDays:number,maximumDays?:number)=>first!==undefined&&meaningfulDates.some(value=>value-first>=minimumDays*DAY&&(maximumDays===undefined||value-first<=maximumDays*DAY));
    return{firstRecord:inventory>=1,fiveRecords:inventory>=5,importCompleted:hasEvent("import-completed"),smokeLogged:owned.some(row=>row.kind==="smokes"),sommUsed:hasEvent("cigar-somm-used"),collectionAction:owned.some(row=>row.kind==="collections"),reportViewed:hasEvent("insurance-report-viewed"),weekOneReturn:returnedWithin(1,7),day30Meaningful:returnedWithin(30),pricingViewed:hasEvent("pricing-viewed"),upgradeIntent:hasEvent("upgrade-clicked")};
  });
  const total=userRows.length;
  const milestone=(key:keyof typeof userRows[number])=>{const count=userRows.filter(row=>row[key]).length;return{count,rate:total?Math.round(count/total*100):null}};
  const unique=(type:string)=>new Set(events.filter(event=>!excluded.has(event.user_id)&&event.event_type===type).map(event=>event.user_id)).size;
  const upgradeImpressions=unique("upgrade-impression"),upgradeClicks=unique("upgrade-clicked"),pricingViews=unique("pricing-viewed");
  return{invited:options.invited??null,confirmed:total,founderAccountsExcluded:excluded.size,meaningfulActivityDefinition,milestones:{firstRecord:milestone("firstRecord"),fiveRecords:milestone("fiveRecords"),importCompleted:milestone("importCompleted"),smokeLogged:milestone("smokeLogged"),sommUsed:milestone("sommUsed"),collectionAction:milestone("collectionAction"),reportViewed:milestone("reportViewed"),weekOneReturn:milestone("weekOneReturn"),day30Meaningful:milestone("day30Meaningful"),pricingViewed:milestone("pricingViewed"),upgradeIntent:milestone("upgradeIntent")},cohorts:{first10:userRows.slice(0,10).length,next25:Math.max(0,Math.min(25,userRows.length-10))},inventoryLots:records.filter(row=>!excluded.has(row.user_id)&&row.kind==="inventory").length,upgradeImpressions,upgradeClicks,pricingViews,upgradeClickRate:upgradeImpressions?Math.round(upgradeClicks/upgradeImpressions*100):null};
}
