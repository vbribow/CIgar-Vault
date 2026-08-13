import "server-only";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { currentBrandText } from "./brand";
import { publicPassportShape, type CollectorPassport } from "./collector-passport";

function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!url||!key)return undefined;return createAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export async function loadCommunityPassports():Promise<CollectorPassport[]>{const client=admin();if(!client)return[];const{data,error}=await client.from("collector_passports").select("handle,display_name,bio,years_collecting,interests,favorite_origins,favorite_makers,favorite_vitolas,featured_cigars,visibility,updated_at").eq("visibility","community").order("updated_at",{ascending:false}).limit(100);if(error){if(error.code==="42P01")return[];throw error}return(data||[]).map(row=>{const value=publicPassportShape(row as Record<string,unknown>);return{...value,displayName:currentBrandText(value.displayName),bio:currentBrandText(value.bio),updatedAt:String(row.updated_at)}})}
