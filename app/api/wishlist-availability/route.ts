import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { loadWishlist } from "@/lib/data";
import { saveOwnedRecord } from "@/lib/user-data";
import { researchWishlistAvailability } from "@/lib/wishlist-availability";
export const maxDuration=120;
async function signedInUser(){if(!supabaseConfigured())return undefined;const{data:{user}}=await(await createClient()).auth.getUser();return user||undefined}
export async function POST(request:Request){const user=await signedInUser();if(!user)return NextResponse.json({error:"Sign in before searching availability"},{status:401});try{const{wishlistId}=await request.json() as{wishlistId?:string};const item=(await loadWishlist()).find(value=>value.wishlistId===wishlistId);if(!item)return NextResponse.json({error:"Wishlist item not found"},{status:404});const result=await researchWishlistAvailability(item,user.email);if(!await saveOwnedRecord("wishlist",item.wishlistId,result.updated))throw new Error("Sign in before saving availability results");return NextResponse.json({data:result.data})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Availability research failed"},{status:502})}}
