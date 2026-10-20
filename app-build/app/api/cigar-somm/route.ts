import { NextResponse } from "next/server";
import { CigarSommQuestionSchema, askCigarSomm, buildCigarSommFallback, requiresSommCatalog } from "@/lib/cigar-somm";
import { buildCigarSommCollectorContext } from "@/lib/cigar-somm-context";
import { loadInventory } from "@/lib/inventory";
import { loadCatalog } from "@/lib/catalog";
import { loadSmokingLogs } from "@/lib/data";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { authorizeWrite } from "@/lib/config";

export const maxDuration = 60;

async function authorized(request: Request) {
  if (authorizeWrite(request)) return true;
  if (!supabaseConfigured()) return false;
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  return Boolean(user);
}

async function recordFirstPartyUse() {
  if (!supabaseConfigured()) return;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: preference } = await supabase
      .from("account_preferences")
      .select("product_analytics")
      .eq("user_id", user.id)
      .maybeSingle();
    if (preference?.product_analytics === false) return;
    await supabase.from("product_events").insert({
      user_id: user.id,
      event_type: "cigar-somm-used",
      properties: {},
    });
  } catch {
    // Optional first-party measurement must never block the collector's answer.
  }
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "Sign in to ask Cigar Somm" }, { status: 401 });
  }
  try {
    const input = CigarSommQuestionSchema.parse(await request.json());
    const inventory = input.inventorySnapshot ?? await loadInventory();
    const smokes = input.smokingSnapshot ?? await loadSmokingLogs();
    // The master catalog can require a remote Smartsheet read. Ordinary cigar
    // pairings never need it; load it only for explicit origin/strength filters.
    const catalog = requiresSommCatalog(input) ? await Promise.race([loadCatalog(inventory),new Promise<Awaited<ReturnType<typeof loadCatalog>>>(resolve=>setTimeout(()=>resolve([]),5_000))]) : [];
    const context = buildCigarSommCollectorContext({
      inventory,
      smokes,
      selectedInventoryId: input.inventoryId,
    });
    const data = await Promise.race([
      askCigarSomm(input, inventory, smokes, context, catalog),
      new Promise<ReturnType<typeof buildCigarSommFallback>>(resolve=>setTimeout(()=>resolve(buildCigarSommFallback(input,inventory,smokes,catalog)),15_000)),
    ]);
    void recordFirstPartyUse();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cigar Somm could not answer";
    return NextResponse.json({ error: message }, { status: message.includes("configured") ? 503 : 422 });
  }
}
