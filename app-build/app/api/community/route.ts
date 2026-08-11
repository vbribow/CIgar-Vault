import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { CommunityPostInput,CommunityRatingInput,communityCigarKey,communityPersonalTop10,communityTop25,type CommunityPost,type CommunityRating } from "@/lib/community";
import { moderateCommunityContent } from "@/lib/community-moderation";
import { createClient,supabaseConfigured } from "@/lib/supabase/server";
import { loadInventory } from "@/lib/inventory";
import { loadSmokingLogs } from "@/lib/data";
import { privateRatingsFromSmokingHistory } from "@/lib/collector-25-contribution";

function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!url||!key)throw new Error("Community database is not configured");return createAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
function contributionSourceUnavailable(error:unknown){const value=error as{code?:string;message?:string}|null;return value?.code==="42703"||/contribution_source.*does not exist/i.test(value?.message||"")}
const postShape=(row:Record<string,unknown>):CommunityPost=>({id:String(row.id),displayName:String(row.display_name),category:row.category as CommunityPost["category"],title:String(row.title),body:String(row.body),status:row.status as CommunityPost["status"],moderationReason:row.moderation_reason?String(row.moderation_reason):undefined,createdAt:String(row.created_at)});
const ratingShape=(row:Record<string,unknown>):CommunityRating=>({id:String(row.id),userId:String(row.user_id),displayName:String(row.display_name),cigarKey:String(row.cigar_key),brand:String(row.brand),line:String(row.line),vitola:String(row.vitola),vintage:row.vintage?String(row.vintage):undefined,score:Number(row.score),review:row.review?String(row.review):undefined,status:row.status as CommunityRating["status"],moderationReason:row.moderation_reason?String(row.moderation_reason):undefined,createdAt:String(row.created_at)});
async function loadAllActiveRatings(client:ReturnType<typeof admin>){const rows:Record<string,unknown>[]=[];const pageSize=1000;for(let from=0;;from+=pageSize){const{data,error}=await client.from("community_ratings").select("*").eq("status","active").order("created_at",{ascending:true}).range(from,from+pageSize-1);if(error)throw error;const page=(data||[]) as Record<string,unknown>[];rows.push(...page);if(page.length<pageSize)break}return rows}

export async function GET(){
  try{
    const client=admin();
    let userId="";
    if(supabaseConfigured()){
      const supabase=await createClient();
      const{data:{user}}=await supabase.auth.getUser();
      userId=user?.id||"";
    }
    let smokingRatings:CommunityRating[]=[];
    if(userId){
      const[smokes,inventory]=await Promise.all([loadSmokingLogs(),loadInventory()]);
      smokingRatings=privateRatingsFromSmokingHistory(smokes,inventory,userId);
      const latestByCigar=new Map<string,CommunityRating>();
      for(const rating of smokingRatings){
        const current=latestByCigar.get(rating.cigarKey);
        if(!current||rating.createdAt>current.createdAt||(rating.createdAt===current.createdAt&&rating.id>current.id))latestByCigar.set(rating.cigarKey,rating);
      }
      const rows=[...latestByCigar.values()].map(rating=>({
        user_id:userId,display_name:"Anonymous collector",cigar_key:rating.cigarKey,
        brand:rating.brand,line:rating.line,vitola:rating.vitola,vintage:rating.vintage===undefined?null:String(rating.vintage),
        score:rating.score,review:null,status:"active",moderation_reason:"Exact-identity numeric score synchronized anonymously from a private smoking record. No private notes were shared.",
        contribution_source:"smoking-journal",updated_at:new Date().toISOString(),
      }));
      if(rows.length){
        let sync=await client.from("community_ratings").upsert(rows,{onConflict:"user_id,cigar_key"});
        if(sync.error&&contributionSourceUnavailable(sync.error))sync=await client.from("community_ratings").upsert(rows.map(({contribution_source:_,...row})=>row),{onConflict:"user_id,cigar_key"});
        // Personal Top 10 is derived from the collector's owned smoking history
        // and must remain available even when the public ranking projection is
        // temporarily unable to reconcile. New scored smokes still use the
        // normal single-record synchronization path.
      }
    }
    const publicPosts=client.from("community_posts").select("*").eq("status","active").order("created_at",{ascending:false}).limit(50);
    const publicRatings=loadAllActiveRatings(client);
    const myPosts=userId?client.from("community_posts").select("*").eq("user_id",userId).order("created_at",{ascending:false}).limit(50):Promise.resolve({data:[],error:null});
    const myRatings=userId?client.from("community_ratings").select("*").eq("user_id",userId).order("updated_at",{ascending:false}).limit(1000):Promise.resolve({data:[],error:null});
    const[posts,ratingRows,ownedPosts,ownedRatings]=await Promise.all([publicPosts,publicRatings,myPosts,myRatings]);
    if(posts.error||ownedPosts.error||ownedRatings.error)throw posts.error||ownedPosts.error||ownedRatings.error;
    const shapedRatings=ratingRows.map(row=>ratingShape(row));
    const shapedOwnedRatings=(ownedRatings.data||[]).map(row=>ratingShape(row));
    return NextResponse.json({data:{posts:(posts.data||[]).map(row=>postShape(row)),top25:communityTop25(shapedRatings),myTop10:communityPersonalTop10([...shapedOwnedRatings,...smokingRatings]),ratingCount:shapedRatings.length,myContributions:{posts:(ownedPosts.data||[]).map(row=>postShape(row)),ratings:shapedOwnedRatings.slice(0,50)}}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Community unavailable"},{status:502})}
}

export async function POST(request:Request){if(!supabaseConfigured())return NextResponse.json({error:"Sign in before contributing"},{status:401});const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in before contributing"},{status:401});try{const payload=await request.json() as{type?:string;data?:unknown};const client=admin();if(payload.type==="post"){const input=CommunityPostInput.parse(payload.data);const recentSince=new Date(Date.now()-120_000).toISOString();const{data:existing,error:lookupError}=await client.from("community_posts").select("*").eq("user_id",user.id).eq("title",input.title).eq("body",input.body).gte("created_at",recentSince).order("created_at",{ascending:false}).limit(1).maybeSingle();if(lookupError)throw lookupError;if(existing)return NextResponse.json({data:postShape(existing),message:existing.status==="active"?"This discussion is already posted.":"This discussion is already awaiting administrator review."});const moderation=await moderateCommunityContent(`${input.title}\n${input.body}`);if(moderation.decision==="block")return NextResponse.json({error:moderation.reason},{status:422});const{data,error}=await client.from("community_posts").insert({user_id:user.id,display_name:input.displayName,category:input.category,title:input.title,body:input.body,status:moderation.decision==="allow"?"active":"review",moderation_reason:moderation.reason}).select().single();if(error)throw error;return NextResponse.json({data:postShape(data),message:moderation.decision==="allow"?"Posted to the community.":"Submitted for administrator review."},{status:201})}if(payload.type==="rating"){const input=CommunityRatingInput.parse(payload.data);const moderation=await moderateCommunityContent(input.review||`${input.brand} ${input.line} ${input.vitola}`);if(moderation.decision==="block")return NextResponse.json({error:moderation.reason},{status:422});const cigarKey=communityCigarKey(input),row={user_id:user.id,display_name:input.displayName,cigar_key:cigarKey,brand:input.brand,line:input.line,vitola:input.vitola,vintage:input.vintage===undefined?null:String(input.vintage),score:input.score,review:input.review||null,status:moderation.decision==="allow"?"active":"review",moderation_reason:moderation.reason,updated_at:new Date().toISOString()};let result=await client.from("community_ratings").upsert({...row,contribution_source:"manual"},{onConflict:"user_id,cigar_key"}).select().single();if(result.error&&contributionSourceUnavailable(result.error))result=await client.from("community_ratings").upsert(row,{onConflict:"user_id,cigar_key"}).select().single();if(result.error)throw result.error;return NextResponse.json({data:ratingShape(result.data),message:moderation.decision==="allow"?"Rating added to the Collector 25 calculation.":"Rating submitted for administrator review."},{status:201})}return NextResponse.json({error:"Unknown community contribution"},{status:400})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid contribution"},{status:422})}}

export async function DELETE(request:Request){
 if(!supabaseConfigured())return NextResponse.json({error:"Sign in before deleting a discussion"},{status:401});
 const supabase=await createClient();
 const{data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in before deleting a discussion"},{status:401});
 try{
  const payload=await request.json() as{id?:unknown};
  const id=typeof payload.id==="string"?payload.id.trim():"";
  if(!id)return NextResponse.json({error:"Choose a discussion to delete"},{status:400});
  const{data,error}=await admin().from("community_posts").delete().eq("id",id).eq("user_id",user.id).select("id").maybeSingle();
  if(error)throw error;
  if(!data)return NextResponse.json({error:"Discussion not found or it belongs to another collector"},{status:404});
  return NextResponse.json({data:{id},message:"Discussion deleted."});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Discussion could not be deleted"},{status:422})}
}
