import { buildAcquisitionPlan } from "./acquisition-planner";
import { buildCollectorDNA } from "./collection-intelligence";
import { summarizeCollection } from "./collection-dashboard";
import type { CigarCollection,InventoryItem,SmokingLog,Valuation,WishlistItem } from "./types";

export type PurchaseCandidate={brand:string;line:string;vitola:string;askingPrice?:number;quantity?:number;collectionId?:string};
export type PurchaseVerdict="Strong fit"|"Consider"|"Proceed carefully"|"Insufficient evidence";

const normalize=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const identity=(value:{brand:string;line:string;vitola:string})=>normalize(`${value.brand} ${value.line} ${value.vitola}`);
const median=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return sorted.length?sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2:undefined};

export function evaluatePurchase(candidate:PurchaseCandidate,input:{inventory:InventoryItem[];valuations:Valuation[];collections:CigarCollection[];smokes:SmokingLog[]}){
  const exact=input.inventory.filter(item=>identity(item)===identity(candidate));
  const quantity=candidate.quantity??1;
  const askingUnit=candidate.askingPrice===undefined?undefined:candidate.askingPrice/quantity;
  const values=input.valuations.filter(value=>{const item=input.inventory.find(entry=>entry.inventoryId===value.inventoryId);return item&&identity(item)===identity(candidate)}).map(value=>value.marketValue??value.replacementValue).filter((value):value is number=>value!==undefined);
  const knownUnit=median(values.length?values:exact.flatMap(item=>item.retailValue===undefined?[]:[item.retailValue]));
  const targetCollection=candidate.collectionId?input.collections.find(item=>item.collectionId===candidate.collectionId):undefined;
  const targetSummary=targetCollection?summarizeCollection(targetCollection,input.inventory,input.valuations):undefined;
  const gap=targetSummary?.missingComponents.some(requirement=>normalize(requirement).split(" ").every(word=>identity(candidate).includes(word)))??false;
  const dna=buildCollectorDNA(input.inventory,input.smokes);
  const preference=dna.topBrands.some(brand=>normalize(brand)===normalize(candidate.brand))||dna.topVitolas.some(vitola=>normalize(vitola)===normalize(candidate.vitola));
  let score=35;const reasons:string[]=[];const cautions:string[]=[];
  if(gap){score+=30;reasons.push("Fills a researched collection gap")}else if(targetCollection)cautions.push("Does not confidently match a missing collection component");
  if(preference){score+=12;reasons.push("Matches positive tasting evidence in Collector DNA")}
  if(exact.length){score-=15;cautions.push(`You already own ${exact.reduce((sum,item)=>sum+(item.currentQty??0),0)} matching cigar(s)`)}else{score+=8;reasons.push("Adds a new exact cigar identity to the vault")}
  if(askingUnit!==undefined&&knownUnit!==undefined){const premium=(askingUnit-knownUnit)/knownUnit;if(premium<=0){score+=18;reasons.push("Asking price is at or below your documented unit value")}else if(premium>.25){score-=22;cautions.push(`Asking price is ${Math.round(premium*100)}% above documented unit value`)}else cautions.push(`Asking price carries a ${Math.round(premium*100)}% premium`)}else cautions.push("No comparable per-cigar value is available");
  score=Math.max(0,Math.min(100,score));const verdict:PurchaseVerdict=askingUnit===undefined?"Insufficient evidence":score>=75?"Strong fit":score>=55?"Consider":score>=35?"Proceed carefully":"Insufficient evidence";
  return{score,verdict,reasons,cautions,askingUnit,knownUnit,existingQuantity:exact.reduce((sum,item)=>sum+(item.currentQty??0),0),collectionImpact:gap?"Completes or advances a researched goal":targetCollection?"No confirmed goal impact":"No collection selected",confidence:knownUnit!==undefined&&(gap||dna.confidence!=="Building")?"High":knownUnit!==undefined||gap?"Medium":"Low" as const};
}

export function buildCollectionGoals(collections:CigarCollection[],inventory:InventoryItem[],valuations:Valuation[]){const targets=buildAcquisitionPlan(collections,inventory,valuations);return collections.map(collection=>{const summary=summarizeCollection(collection,inventory,valuations);const next=targets.find(target=>target.collectionId===collection.collectionId);return{collection,progress:summary.completionPercent,owned:summary.ownedComponents,expected:summary.expectedComponents,remaining:summary.missingComponents.length,nextAction:next?`Find ${next.requirement}`:summary.completionPercent===100?"Preserve provenance and current value":"Research the expected components",estimatedImpact:next?.estimatedValueImpact??0,status:summary.completionPercent===100?"Complete":summary.completionPercent>=75?"Within reach":summary.completionPercent>=40?"Building":"Started"}}).sort((a,b)=>b.progress-a.progress)}

const agingProfiles=[
  {pattern:/cohiba|trinidad|bolivar|partagas|hoyo de monterrey|montecristo|romeo y julieta/i,label:"Cuban long-aging profile",start:7,end:20,flavor:"Strength often integrates while cedar, leather, earth, sweetness, and tertiary aromas may deepen."},
  {pattern:/opusx|forbidden x|anejo/i,label:"Fuente powerhouse profile",start:5,end:15,flavor:"Pepper and structure may soften as cedar, dried fruit, baking spice, and sweetness integrate."},
  {pattern:/padron/i,label:"Padrón mature-tobacco profile",start:2,end:10,flavor:"Already-aged tobacco may round further, with cocoa, coffee, earth, and pepper becoming more integrated."},
  {pattern:/davidoff/i,label:"Davidoff refined profile",start:2,end:8,flavor:"Subtle cream, cedar, grain, and spice can integrate; extended age may reduce delicacy."},
];
export function blendAgingGuidance(item:InventoryItem,now=new Date()){const year=Number(item.vintage),text=`${item.brand} ${item.line}`,profile=agingProfiles.find(value=>value.pattern.test(text))??{label:"Premium cigar baseline",start:3,end:10,flavor:"Edges may soften and cedar, earth, cream, sweetness, and spice may integrate, depending on blend and storage."};if(!Number.isInteger(year))return{phase:"Year needed",window:undefined,flavor:profile.flavor,basis:`${profile.label}; add a release or production year.`,confidence:"Low" as const};const age=Math.max(0,now.getUTCFullYear()-year),phase=age<profile.start?"Developing":age<=profile.end?"In profile window":"Extended beyond profile";return{phase,window:`${year+profile.start}–${year+profile.end}`,flavor:profile.flavor,basis:`${profile.label}; storage and personal tasting evidence can override this general profile.`,confidence:agingProfiles.some(value=>value===profile)?"Medium" as const:"Low" as const}}

function sourceRegion(url:string){try{const host=new URL(url).hostname.toLowerCase();if(host.endsWith(".co.uk")||host.endsWith(".uk"))return"UK";if(host.endsWith(".ch"))return"Switzerland";if(host.endsWith(".hk"))return"Hong Kong";if(/\.(de|fr|es|it|nl|be)$/.test(host))return"EU";if(host.endsWith(".com")||host.endsWith(".us"))return"US/global"}catch{/* source URLs are validated upstream */}return"Region unconfirmed"}
export function buildMarketChannels(wishlist:WishlistItem[]){const listings=wishlist.flatMap(item=>(item.availabilityListings??[]).map(listing=>({item,listing,region:sourceRegion(listing.url)})));const keys=[...new Set(listings.map(({listing,region})=>`${listing.sellerType} · ${region}`))];const groups=keys.map(channel=>{const rows=listings.filter(({listing,region})=>`${listing.sellerType} · ${region}`===channel);const units=rows.flatMap(({listing})=>listing.unitPrice===undefined?[]:[listing.unitPrice]);return{channel,count:rows.length,open:rows.filter(({listing})=>listing.availability==="In stock"||listing.availability==="Auction open").length,medianUnit:median(units),sources:rows.slice(0,4)}});return{groups,total:listings.length,open:listings.filter(({listing})=>listing.availability==="In stock"||listing.availability==="Auction open").length,auctionLots:listings.filter(({listing})=>listing.sellerType==="Auction"&&listing.availability==="Auction open").length,disclosure:"Channel comparisons use saved direct listings. Region is inferred from the source domain and is not proof of inventory location. Prices are normalized only when listing quantity supports a per-cigar calculation; taxes, buyer premiums, shipping, authenticity, currency conversion, and local law still require review."}}
