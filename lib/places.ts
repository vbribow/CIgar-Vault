import { z } from "zod";

export const placeVibes=["Low-key","Relaxed","Traditional","Professional","Upscale","Private-club atmosphere","Social and lively","Neighborhood-oriented","Beginner-friendly","Collector-focused","Business-friendly","Date-night appropriate","Sports-focused","Quiet and conversation-friendly","Entertainment and nightlife"] as const;
export const placeCapabilities=["Cigar lounge","Cigar bar","Brick-and-mortar retailer","Walk-in humidor","On-site smoking","Spirits and cocktails","Food","Membership required","Outdoor smoking only"] as const;
export const certificationLevels=["Cedriva Certified","Cedriva Distinguished","Cedriva Destination","Not Yet Certified"] as const;
export const certificationDisplayLabels:Record<(typeof certificationLevels)[number],string>={
 "Cedriva Certified":"Reviewed",
 "Cedriva Distinguished":"Distinguished",
 "Cedriva Destination":"Destination",
 "Not Yet Certified":"Not yet reviewed",
};

export const PlaceReviewInput=z.object({
 googlePlaceId:z.string().trim().min(3).max(300),
 displayName:z.string().trim().min(2).max(100),
 score:z.coerce.number().int().min(1).max(100),
 visitDate:z.string().date(),
 vibes:z.array(z.enum(placeVibes)).max(3).default([]),
 capabilities:z.array(z.enum(placeCapabilities)).max(9).default([]),
 review:z.string().trim().max(500).default(""),
 conflictDisclosure:z.string().trim().max(500).optional(),
}).strict();

export const PlaceCertificationInput=z.object({
 googlePlaceId:z.string().trim().min(3).max(300),
 level:z.enum(certificationLevels),
 score:z.coerce.number().int().min(1).max(100),
 visitMonth:z.string().regex(/^\d{4}-\d{2}$/),
 summary:z.string().trim().min(40).max(3000),
 strengths:z.string().trim().min(10).max(1500),
 opportunities:z.string().trim().max(1500).optional(),
 complimentaryDisclosure:z.string().trim().max(500).optional(),
 nextReviewDate:z.string().date(),
}).strict();

export type PlaceReview=z.infer<typeof PlaceReviewInput>&{id:string;userId:string;status:"active"|"review";createdAt:string};
export type PlaceCertification=z.infer<typeof PlaceCertificationInput>&{id:string;active:boolean;createdAt:string};
export type GooglePlaceResult={googlePlaceId:string;name:string;address:string;googleRating?:number;googleReviewCount?:number;googleMapsUri:string;websiteUri?:string;businessStatus?:string;latitude?:number;longitude?:number};

export function communityPlaceScore(reviews:Pick<PlaceReview,"score">[]){
 if(!reviews.length)return undefined;
 return Math.round(reviews.reduce((sum,review)=>sum+review.score,0)/reviews.length*10)/10;
}
export function vibeConsensus(reviews:Pick<PlaceReview,"vibes">[],limit=3){
 const counts=new Map<string,number>();
 reviews.flatMap(review=>review.vibes).forEach(vibe=>counts.set(vibe,(counts.get(vibe)||0)+1));
 return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit).map(([vibe,count])=>({vibe,count}));
}
export function weightedGoogleScore(rating:number|undefined,count:number|undefined,baseline=4.2,weight=40){
 if(rating===undefined||!count)return 0;
 return (rating*count+baseline*weight)/(count+weight);
}
export function communityPlaceRankingScore(score:number|undefined,count:number,baseline=85,weight=5){
 if(score===undefined||!count)return undefined;
 return Math.round(((score*count+baseline*weight)/(count+weight))*10)/10;
}
export function rankPlaces<T extends GooglePlaceResult&{cedrivaScore?:number;cedrivaReviewCount:number}>(places:T[]){
 return [...places].sort((a,b)=>{
  const aEligible=a.cedrivaReviewCount>=5,bEligible=b.cedrivaReviewCount>=5;
  if(aEligible!==bEligible)return aEligible?-1:1;
  const aCommunity=communityPlaceRankingScore(a.cedrivaScore,a.cedrivaReviewCount);
  const bCommunity=communityPlaceRankingScore(b.cedrivaScore,b.cedrivaReviewCount);
  if(aCommunity!==undefined||bCommunity!==undefined)return(bCommunity??0)-(aCommunity??0);
  return weightedGoogleScore(b.googleRating,b.googleReviewCount)-weightedGoogleScore(a.googleRating,a.googleReviewCount);
 });
}
