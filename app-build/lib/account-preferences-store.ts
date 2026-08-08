import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
export const preferenceColumns = "email_notifications,wishlist_alerts,valuation_research,rating_research,collector_25_contributions,product_analytics,upgrade_recommendations,updated_at";
export const legacyPreferenceColumns = "email_notifications,wishlist_alerts,valuation_research,rating_research,product_analytics,upgrade_recommendations,updated_at";

export function collector25PreferenceUnavailable(error:unknown){
  const value=error as {code?:string;message?:string}|null;
  return value?.code==="42703"||/collector_25_contributions.*does not exist/i.test(value?.message||"");
}

export async function loadAccountPreferenceRow(supabase:SupabaseClient,userId:string){
  const current=await supabase.from("account_preferences").select(preferenceColumns).eq("user_id",userId).maybeSingle();
  if(!current.error)return{data:current.data as Record<string,unknown>|null,error:null,collector25Available:true};
  if(!collector25PreferenceUnavailable(current.error))return{data:null,error:current.error,collector25Available:false};
  const legacy=await supabase.from("account_preferences").select(legacyPreferenceColumns).eq("user_id",userId).maybeSingle();
  return{data:legacy.data as Record<string,unknown>|null,error:legacy.error,collector25Available:false};
}
