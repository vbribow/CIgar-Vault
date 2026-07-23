import { NextResponse } from "next/server";
import { loadInventory } from "@/lib/inventory";
import { researchCigarRatings } from "@/lib/cigar-ratings";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { authorizeWrite } from "@/lib/config";
async function authorized(request:Request){if(authorizeWrite(request))return true;if(!supabaseConfigured())return false;const{data:{user}}=await(await createClient()).auth.getUser();return Boolean(user)}
export async function POST(request:Request){if(!await authorized(request))return NextResponse.json({error:"Sign in before researching professional ratings"},{status:401});try{const{inventoryId}=await request.json() as {inventoryId?:string};const item=(await loadInventory()).find(record=>record.inventoryId===inventoryId);if(!item)return NextResponse.json({error:"Inventory lot not found"},{status:404});return NextResponse.json({data:{inventoryId:item.inventoryId,...await researchCigarRatings(item)}})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Rating research failed"},{status:502})}}
