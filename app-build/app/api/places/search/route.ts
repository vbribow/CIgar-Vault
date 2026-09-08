import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { filterPlacesByRadius,isConfirmedCigarLoungeCandidate,rankPlaces,type GooglePlaceResult,type PlaceCertification,type PlaceReview,vibeConsensus,communityPlaceScore,normalizeCertificationLevel } from "@/lib/places";
import { createClient } from "@/lib/supabase/server";
import { normalizePlaceSearch,placeSearchHint } from "@/lib/place-search";
import { finishPlaceSearch, PlaceSearchGuardError, reservePlaceSearch } from "@/lib/place-search-guard";

export const dynamic="force-dynamic";
const fieldMask="places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.businessStatus,places.websiteUri,places.googleMapsUri";
function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();return url&&key?createAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):undefined}
function optionalPlaceTableMissing(error:unknown,table:string){const value=error as{code?:string;message?:string}|null;return value?.code==="PGRST205"&&Boolean(value.message?.includes(`public.${table}`))}
async function googleSearch(query:string,key:string){
 const response=await fetch("https://places.googleapis.com/v1/places:searchText",{method:"POST",headers:{"content-type":"application/json","X-Goog-Api-Key":key,"X-Goog-FieldMask":fieldMask},body:JSON.stringify({textQuery:query,languageCode:"en",regionCode:"US",rankPreference:"RELEVANCE",pageSize:20}),cache:"no-store"});
 if(!response.ok)throw new Error(`Google Places search failed (${response.status})`);
 const body=await response.json() as{places?:Array<Record<string,any>>};
 return(body.places||[]).map((place):GooglePlaceResult=>({googlePlaceId:String(place.id),name:String(place.displayName?.text||"Unnamed location"),address:String(place.formattedAddress||""),googleRating:place.rating===undefined?undefined:Number(place.rating),googleReviewCount:place.userRatingCount===undefined?undefined:Number(place.userRatingCount),googleMapsUri:String(place.googleMapsUri||`https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(String(place.id))}`),websiteUri:place.websiteUri?String(place.websiteUri):undefined,businessStatus:place.businessStatus?String(place.businessStatus):undefined,latitude:place.location?.latitude,longitude:place.location?.longitude}));
}
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const location=normalizePlaceSearch(params.get("location")||params.get("zip")||"");
 if(!location)return NextResponse.json({error:placeSearchHint},{status:422});
 const requestedRadius=Number(params.get("radius"));
 const radiusMiles=[10,25,50].includes(requestedRadius)?requestedRadius:25;
 const{data:{user}}=await(await createClient()).auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to search nearby cigar places."},{status:401});
 const key=process.env.GOOGLE_PLACES_API_KEY?.trim();
 if(process.env.GOOGLE_PLACES_SEARCH_ENABLED!=="true"||!key)return NextResponse.json({
  error:"Live location discovery is temporarily unavailable. Saved Places and community ratings remain available while this service is being prepared.",
  code:"LIVE_DISCOVERY_UNAVAILABLE",
 },{status:503});
 const db=admin();
 if(!db)return NextResponse.json({error:"Live location discovery is temporarily unavailable. Saved Places and community ratings remain available.",code:"LIVE_DISCOVERY_UNAVAILABLE"},{status:503});
 let reservation:Awaited<ReturnType<typeof reservePlaceSearch>>|undefined;
 try{
  reservation=await reservePlaceSearch(db,user.id,`${location}|${radiusMiles}`);
  const googleResults=(await googleSearch(`cigar lounge or cigar bar near ${location}`,key)).filter(place=>place.businessStatus!=="CLOSED_PERMANENTLY"&&isConfirmedCigarLoungeCandidate(place));
  const unique=filterPlacesByRadius(googleResults,radiusMiles);
  let reviews:PlaceReview[]=[];let certifications:PlaceCertification[]=[];
  if(unique.length){const ids=unique.map(place=>place.googlePlaceId);const[reviewRows,certRows]=await Promise.all([db.from("place_reviews").select("*").in("google_place_id",ids).eq("status","active"),db.from("place_certifications").select("*").in("google_place_id",ids).eq("active",true)]);if(reviewRows.error&&!optionalPlaceTableMissing(reviewRows.error,"place_reviews"))throw reviewRows.error;if(certRows.error&&!optionalPlaceTableMissing(certRows.error,"place_certifications"))throw certRows.error;reviews=(reviewRows.data||[]).map(row=>({id:row.id,userId:row.user_id,googlePlaceId:row.google_place_id,displayName:row.display_name,score:row.score,visitDate:row.visit_date,vibes:row.vibes,capabilities:row.capabilities,review:row.review,conflictDisclosure:row.conflict_disclosure||undefined,status:row.status,createdAt:row.created_at}));certifications=(certRows.data||[]).map(row=>({id:row.id,googlePlaceId:row.google_place_id,level:normalizeCertificationLevel(row.level),score:row.score,visitMonth:row.visit_month,summary:row.summary,strengths:row.strengths,opportunities:row.opportunities||undefined,complimentaryDisclosure:row.complimentary_disclosure||undefined,nextReviewDate:row.next_review_date,active:row.active,createdAt:row.created_at}))}
  const data=rankPlaces(unique.map(place=>{const placeReviews=reviews.filter(review=>review.googlePlaceId===place.googlePlaceId);return{...place,communityScore:communityPlaceScore(placeReviews),communityReviewCount:placeReviews.length,communityScoreStatus:placeReviews.length>=5?"Established":"Developing",vibes:vibeConsensus(placeReviews),certification:certifications.find(value=>value.googlePlaceId===place.googlePlaceId)}}));
  await finishPlaceSearch(db,reservation.eventId,reservation.queryHash,"completed");
  return NextResponse.json({data,meta:{location,radiusMiles,googleAttributionRequired:true,retrievedAt:new Date().toISOString(),dailyLimit:reservation.dailyLimit,searchesUsedToday:reservation.usedToday,methodology:`Results are limited to ${radiusMiles} miles of Google's closest match for your search. Lounges with at least five community ratings rank first using a sample-size-adjusted community score; Google remains a separate discovery signal.`}},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
 }catch(error){
  if(reservation)try{await finishPlaceSearch(db,reservation.eventId,reservation.queryHash,"failed")}catch{}
  if(error instanceof PlaceSearchGuardError)return NextResponse.json({error:error.message,code:error.code},{status:error.status,headers:{"Cache-Control":"private, no-store, max-age=0"}});
  console.error("Places search failed",error);
  return NextResponse.json({
   error:"Live location discovery is temporarily unavailable. Please try again later.",
   code:"LIVE_DISCOVERY_UNAVAILABLE",
  },{status:502});
 }
}
