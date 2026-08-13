import "server-only";
import { createClient } from "@supabase/supabase-js";
import { currentBrandText } from "./brand";
export type CommunityPostSummary={id:string;title:string;category:string};
export async function loadCommunityPostSummaries():Promise<CommunityPostSummary[]>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!url||!key)return[];const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),{data,error}=await client.from("community_posts").select("id,title,category").eq("status","active").order("created_at",{ascending:false}).limit(5);if(error)return[];return(data||[]).map(row=>({id:String(row.id),title:currentBrandText(String(row.title)),category:String(row.category)}))}
