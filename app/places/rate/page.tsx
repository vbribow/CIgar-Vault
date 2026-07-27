import type{Metadata}from"next";
import Link from"next/link";
import{QuickPlaceRating}from"@/components/quick-place-rating";
import{brand}from"@/lib/brand";
import"../places.css";

export const metadata:Metadata={title:"Rate a Cigar Lounge",description:"Share a quick, verified lounge visit with the collector community."};

export default async function RatePlacePage({searchParams}:{searchParams:Promise<{place?:string;name?:string;source?:string}>}){
 const params=await searchParams;
 const place=(params.place||"").trim(),name=(params.name||"").trim();
 if(!place||!name)return <main className="shell quickRatingPage"><section className="card quickRatingMissing"><div className="eyebrow">{brand.labels.loungePassport}</div><h1>This rating link is incomplete.</h1><p>Scan the lounge’s QR code again, or find the lounge in Places.</p><Link className="button" href="/places">Find a lounge</Link></section></main>;
 return <main className="shell quickRatingPage"><Link className="quickRatingBack" href="/places">← {brand.labels.places}</Link><section className="passportIntro"><div className="eyebrow">{brand.labels.loungePassport}</div><h1>Your visit matters.</h1><p>A few taps help collectors find rooms worth visiting. This QR confirms where the rating began; your signed-in account protects the ranking from duplicates.</p></section><QuickPlaceRating googlePlaceId={place} name={name}/></main>;
}
