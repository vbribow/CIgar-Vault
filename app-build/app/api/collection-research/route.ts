import { NextResponse } from "next/server";
import { collectionSearchUrl, parseCollectionSearchRss } from "@/lib/collection-research";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (query.length < 3) return NextResponse.json({ error: "Enter at least 3 characters" }, { status: 400 });
  try {
    const response = await fetch(collectionSearchUrl(query), {
      headers: { "User-Agent": "Cedriva collection research" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`Search provider returned ${response.status}`);
    return NextResponse.json({ data: parseCollectionSearchRss(await response.text()) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Collection search failed" }, { status: 502 });
  }
}
