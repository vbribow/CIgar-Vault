import { NextResponse } from "next/server";
import { ProfessionalRatingSchema } from "@/lib/cigar-ratings";
import { loadRatings } from "@/lib/data";
import { saveOwnedRecord } from "@/lib/user-data";
export async function GET(){try{return NextResponse.json({data:await loadRatings()})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Ratings failed"},{status:502})}}
export async function POST(request:Request){try{const rating=ProfessionalRatingSchema.parse(await request.json());if(!await saveOwnedRecord("ratings",rating.ratingId,rating))return NextResponse.json({error:"Sign in to save professional ratings"},{status:401});return NextResponse.json({data:rating},{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid professional rating"},{status:422})}}
