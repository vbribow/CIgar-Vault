import { NextResponse } from "next/server";
import { collectionVerificationSearchUrls, parseCollectionSearchRss } from "@/lib/collection-research";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (query.length < 3) return NextResponse.json({ error: "Enter at least 3 characters" }, { status: 400 });
  try {
    const responses=await Promise.all(collectionVerificationSearchUrls(query).map(url=>fetch(url,{
      headers: { "User-Agent": "Premium cigar collection research" },
      next: { revalidate: 3600 },
    })));
    const successful=responses.filter(response=>response.ok);
    if(!successful.length)throw new Error(`Search provider returned ${responses.map(response=>response.status).join(", ")}`);
    const groups=await Promise.all(successful.map(async response=>parseCollectionSearchRss(await response.text())));
    const seen=new Set<string>();
    const data=groups.flat().filter(result=>{if(seen.has(result.url))return false;seen.add(result.url);return true}).slice(0,10);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Collection search failed" }, { status: 502 });
  }
}
