import { NextResponse } from "next/server";
import { WishlistItemSchema } from "@/lib/wishlist-model";
import { loadWishlist } from "@/lib/data";
import { saveOwnedRecord } from "@/lib/user-data";
export async function GET(){try{return NextResponse.json({data:await loadWishlist()})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Failed"},{status:502})}}
export async function POST(request:Request){try{const item=WishlistItemSchema.parse(await request.json());if(!await saveOwnedRecord("wishlist",item.wishlistId,item))return NextResponse.json({error:"Sign in to save wishlist items"},{status:401});return NextResponse.json({data:item},{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid wishlist item"},{status:422})}}
