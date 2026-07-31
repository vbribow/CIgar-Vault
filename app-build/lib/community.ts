import { z } from "zod";
import { cigarIdentityKey } from "./cigar-identity";

export const CommunityPostInput=z.object({displayName:z.string().trim().min(2).max(40),category:z.enum(["General","Cigar discussion","Collection care","Humidors","Events"]),title:z.string().trim().min(4).max(120),body:z.string().trim().min(10).max(4000)}).strict();
export const CommunityRatingInput=z.object({displayName:z.string().trim().min(2).max(40),brand:z.string().trim().min(2).max(100),line:z.string().trim().min(1).max(150),vitola:z.string().trim().min(1).max(120),vintage:z.union([z.string().trim().max(20),z.number()]).optional(),score:z.coerce.number().int().min(1).max(100),review:z.string().trim().max(1200).optional()}).strict();
export type CommunityContributionStatus="active"|"review"|"changes"|"hidden";
export type CommunityPost=z.infer<typeof CommunityPostInput>&{id:string;createdAt:string;status:CommunityContributionStatus;moderationReason?:string};
export type CommunityRating=z.infer<typeof CommunityRatingInput>&{id:string;createdAt:string;status:CommunityContributionStatus;cigarKey:string;userId?:string;moderationReason?:string};
export type CommunityRanking={rank:number;cigarKey:string;brand:string;line:string;vitola:string;vintage?:string|number;averageScore:number;weightedScore:number;ratingCount:number;confidence:"provisional"|"developing"|"established"};

export function communityCigarKey(value:Pick<CommunityRating,"brand"|"line"|"vitola"|"vintage">){return cigarIdentityKey(value)}
const roundScore=(value:number)=>Math.round(value*10)/10;
const collectorKey=(rating:CommunityRating)=>rating.userId||`display:${rating.displayName.trim().toLowerCase()}`;
const isEligibleRating=(rating:CommunityRating)=>rating.status==="active"&&Number.isInteger(rating.score)&&rating.score>=1&&rating.score<=100&&Boolean(rating.brand.trim()&&rating.line.trim()&&rating.vitola.trim());

function latestCollectorRatings(ratings:CommunityRating[]){
  const unique=new Map<string,CommunityRating>();
  for(const rating of ratings.filter(isEligibleRating)){
    const key=`${collectorKey(rating)}|${communityCigarKey(rating)}`;
    const current=unique.get(key);
    if(!current||rating.createdAt>current.createdAt||(rating.createdAt===current.createdAt&&rating.id>current.id))unique.set(key,rating);
  }
  return [...unique.values()];
}

export function communityPersonalTop10(ratings:CommunityRating[]):CommunityRanking[]{
  return latestCollectorRatings(ratings)
    .sort((a,b)=>b.score-a.score||b.createdAt.localeCompare(a.createdAt)||communityCigarKey(a).localeCompare(communityCigarKey(b)))
    .slice(0,10)
    .map((value,index)=>({
      rank:index+1,
      cigarKey:communityCigarKey(value),
      brand:value.brand,
      line:value.line,
      vitola:value.vitola,
      vintage:value.vintage,
      averageScore:value.score,
      weightedScore:value.score,
      ratingCount:1,
      confidence:"provisional"
    }));
}

export function communityTop25(ratings:CommunityRating[]):CommunityRanking[]{
  const active=latestCollectorRatings(ratings);
  const byCollector=new Map<string,CommunityRating[]>();
  for(const rating of active){
    const key=collectorKey(rating);
    byCollector.set(key,[...(byCollector.get(key)||[]),rating]);
  }
  const topTenRank=new Map<string,number>();
  for(const [collector,values] of byCollector){
    for(const item of communityPersonalTop10(values)){
      topTenRank.set(`${collector}|${item.cigarKey}`,item.rank);
    }
  }
  const groups=new Map<string,CommunityRating[]>();
  for(const rating of active){
    const key=communityCigarKey(rating);
    groups.set(key,[...(groups.get(key)||[]),rating]);
  }
  const calculated=[...groups.entries()].map(([cigarKey,values])=>{
    const first=values[0];
    const contributions=values.map(value=>{
      const personalRank=topTenRank.get(`${collectorKey(value)}|${cigarKey}`);
      const preferenceSignal=personalRank ? 101-personalRank : value.score;
      const collectorRatingCount=byCollector.get(collectorKey(value))?.length||1;
      const preferenceWeight=.2*Math.min(collectorRatingCount/10,1);
      return value.score*(1-preferenceWeight)+preferenceSignal*preferenceWeight;
    });
    return {
      rank:0,
      cigarKey,
      brand:first.brand,
      line:first.line,
      vitola:first.vitola,
      vintage:first.vintage,
      averageScore:roundScore(values.reduce((sum,value)=>sum+value.score,0)/values.length),
      weightedScore:roundScore(contributions.reduce((sum,value)=>sum+value,0)/contributions.length),
      ratingCount:values.length,
      confidence:(values.length>=10?"established":values.length>=3?"developing":"provisional") as CommunityRanking["confidence"],
      contributions
    };
  });
  const allContributions=calculated.flatMap(value=>value.contributions);
  const communityMean=allContributions.length?allContributions.reduce((sum,value)=>sum+value,0)/allContributions.length:0;
  const priorWeight=3;
  return calculated.map(value=>({
    ...value,
    weightedScore:roundScore((value.contributions.reduce((sum,score)=>sum+score,0)+communityMean*priorWeight)/(value.ratingCount+priorWeight))
  })).sort((a,b)=>b.weightedScore-a.weightedScore||b.averageScore-a.averageScore||b.ratingCount-a.ratingCount||a.brand.localeCompare(b.brand)).slice(0,25).map(({contributions:_,...value},index)=>({...value,rank:index+1}));
}
export function communityStatusLabel(status:CommunityContributionStatus){return status==="active"?"Published":status==="review"?"Under Review":status==="changes"?"Needs Changes":"Not Published"}

export type ModerationDecision={decision:"allow"|"review"|"block";reason:string};
export function baselineCommunityModeration(text:string):ModerationDecision{const normalized=text.toLowerCase();if(/\b(buy|sell|venmo|cashapp|paypal|ship(?:ping)? to|price shipped|dm me)\b/.test(normalized))return{decision:"block",reason:"Buying, selling, and transaction arrangements are not allowed in the community."};if(/\b(kill yourself|racial slur|doxx|home address)\b/.test(normalized))return{decision:"block",reason:"Threatening, hateful, or personally identifying content is not allowed."};if(/https?:\/\/|\b(?:email|phone|text me)\b/.test(normalized))return{decision:"review",reason:"External links or contact details require administrator review."};return{decision:"allow",reason:"Passed community safety rules."}}
