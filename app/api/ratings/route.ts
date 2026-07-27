import { NextResponse } from "next/server";
import { ProfessionalRatingCreateSchema } from "@/lib/cigar-ratings";
import { loadRatings } from "@/lib/data";
import { createOwnedRecord, loadOwnedRecord } from "@/lib/user-data";
import { createServerRecordId } from "@/lib/server-record-id";
import type { ProfessionalRating } from "@/lib/types";
export async function GET(){try{return NextResponse.json({data:await loadRatings()})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Ratings failed"},{status:502})}}
export async function POST(request:Request){try{const input=ProfessionalRatingCreateSchema.parse(await request.json());const{submissionId,...fields}=input;const rating:ProfessionalRating={ratingId:createServerRecordId("rating",submissionId),...fields};const created=await createOwnedRecord("ratings",rating.ratingId,rating);if(created==="exists"){const existing=await loadOwnedRecord<ProfessionalRating>("ratings",rating.ratingId);if(existing&&JSON.stringify(existing)===JSON.stringify(rating))return NextResponse.json({data:existing,retry:true});throw new Error("This submission was already used for a different rating")}if(created!=="created")return NextResponse.json({error:"Sign in to save professional ratings"},{status:401});return NextResponse.json({data:rating},{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid professional rating"},{status:422})}}
