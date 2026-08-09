import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/catalog";
import { loadRatings } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { accountDataMode } from "@/lib/user-data";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0, must-revalidate", Pragma: "no-cache" };

export async function GET(request: Request) {
  try {
    const kind = new URL(request.url).searchParams.get("kind");
    if (kind === "catalog") {
      const inventory = await loadInventory();
      return NextResponse.json({ data: await loadCatalog(inventory) }, { headers: privateHeaders });
    }
    if (kind === "ratings") {
      const mode = await accountDataMode();
      return NextResponse.json({ data: mode === "mock" ? [] : await loadRatings() }, { headers: privateHeaders });
    }
    return NextResponse.json({ error: "Choose catalog or ratings support." }, { status: 400, headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "Supporting information is temporarily unavailable. Your Vault is unchanged." }, { status: 503, headers: privateHeaders });
  }
}
