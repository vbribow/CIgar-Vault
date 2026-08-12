import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { collector25ContributionFromSmoke, privateRatingsFromSmokingHistory } from "../lib/collector-25-contribution";
import type { InventoryItem, SmokingLog } from "../lib/types";

const inventory:InventoryItem={inventoryId:"INV-1",brand:"H. Upmann",line:"Magnum 46",vitola:"Corona Gorda",vintage:2021};
const smoke:SmokingLog={smokeId:"SMOKE-1",inventoryId:"INV-1",dateSmoked:"2026-08-05",overall:94,tastingNotes:"Private notes",buyAgain:true};

test("an eligible smoke contributes only exact identity and a numeric score",()=>{
  const contribution=collector25ContributionFromSmoke(smoke,inventory);
  assert.deepEqual(contribution,{brand:"H. Upmann",line:"Magnum 46",vitola:"Corona Gorda",vintage:2021,score:94,cigarKey:"h-upmann|magnum-46|corona-gorda|2021"});
  assert.equal("tastingNotes" in (contribution||{}),false);
  assert.equal("inventoryId" in (contribution||{}),false);
  assert.equal("buyAgain" in (contribution||{}),false);
});

test("unconfirmed manual, mismatched, missing, and zero scores never enter Collector 25",()=>{
  assert.equal(collector25ContributionFromSmoke({...smoke,inventoryId:"MANUAL"},inventory),undefined);
  assert.equal(collector25ContributionFromSmoke(smoke,{...inventory,inventoryId:"INV-2"}),undefined);
  assert.equal(collector25ContributionFromSmoke({...smoke,overall:undefined},inventory),undefined);
  assert.equal(collector25ContributionFromSmoke({...smoke,overall:0},inventory),undefined);
});

test("a confirmed outside-Vault smoke contributes its structured identity without private fields",()=>{
  const contribution=collector25ContributionFromSmoke({...smoke,inventoryId:"MANUAL",cigarName:"Arturo Fuente OpusX Petite Lancero",outsideInventory:true,cigarBrand:"Arturo Fuente",cigarLine:"Fuente Fuente OpusX",cigarVitola:"Petite Lancero"});
  assert.deepEqual(contribution,{brand:"Arturo Fuente",line:"Fuente Fuente OpusX",vitola:"Petite Lancero",vintage:undefined,score:94,cigarKey:"arturo-fuente|fuente-fuente-opusx|petite-lancero|"});
  assert.equal("outsideInventory" in (contribution||{}),false);
  assert.equal("cigarName" in (contribution||{}),false);
});

test("private Top 10 inputs come from scored smoke history without exposing journal details",()=>{
  const ratings=privateRatingsFromSmokingHistory([
    {...smoke,tastingNotes:"Private note",overall:96},
    {...smoke,smokeId:"SMOKE-2",inventoryId:"MANUAL",cigarName:"Gift cigar",outsideInventory:true,cigarBrand:"Padron",cigarLine:"1964 Anniversary",cigarVitola:"Diplomatico",overall:94},
    {...smoke,smokeId:"SMOKE-3",inventoryId:"MANUAL",cigarName:"Unknown gift",overall:99},
  ],[inventory],"collector-1");
  assert.equal(ratings.length,2);
  assert.deepEqual(ratings.map(({brand,line,vitola,score})=>({brand,line,vitola,score})),[
    {brand:inventory.brand,line:inventory.line,vitola:inventory.vitola,score:96},
    {brand:"Padron",line:"1964 Anniversary",vitola:"Diplomatico",score:94},
  ]);
  assert.equal("review" in ratings[0],false);
  assert.equal(JSON.stringify(ratings).includes("Private note"),false);
});

test("smoking sync is automatic, anonymous, deduplicated, and non-blocking",()=>{
  const helper=readFileSync(new URL("../lib/collector-25-contribution.ts",import.meta.url),"utf8");
  const route=readFileSync(new URL("../app/api/smoking-log/route.ts",import.meta.url),"utf8");
  const migration=readFileSync(new URL("../supabase/migrations/202608050001_collector_25_smoke_contributions.sql",import.meta.url),"utf8");
  const automaticMigration=readFileSync(new URL("../supabase/migrations/202608100001_automatic_collector_25_scores.sql",import.meta.url),"utf8");
  assert.doesNotMatch(helper,/collector_25_contributions !== true/);
  assert.match(helper,/display_name: "Anonymous collector"/);
  assert.match(helper,/review: null/);
  assert.match(helper,/onConflict: "user_id,cigar_key"/);
  assert.match(helper,/catch \{[\s\S]*status: "unavailable"/);
  assert.match(route,/data: item, collector25: await syncCollector25Contribution/);
  assert.match(migration,/collector_25_contributions boolean not null default false/);
  assert.match(migration,/contribution_source in \('manual', 'smoking-journal'\)/);
  assert.match(migration,/if new\.collector_25_contributions is false/);
  assert.match(migration,/delete from public\.community_ratings[\s\S]*contribution_source = 'smoking-journal'/);
  assert.match(automaticMigration,/drop trigger if exists withdraw_smoking_journal_community_ratings/);
  assert.match(automaticMigration,/set collector_25_contributions = true/);
});

test("collector UX explains automatic contribution, privacy, and the manual correction path",()=>{
  const account=readFileSync(new URL("../components/account-preferences-panel.tsx",import.meta.url),"utf8");
  const journal=readFileSync(new URL("../components/records-manager.tsx",import.meta.url),"utf8");
  const community=readFileSync(new URL("../components/community-hub.tsx",import.meta.url),"utf8");
  assert.doesNotMatch(account,/type="checkbox"[^>]*collector25Contributions/);
  assert.match(account,/name, notes, inventory, purchase details, and location remain private/);
  assert.match(journal,/anonymous score updated the Hojavía 25/);
  assert.match(journal,/I can confirm the exact brand, line, and vitola/);
  assert.match(journal,/numeric score anonymously/);
  assert.match(community,/Scores from exact Vault cigars update automatically/);
  assert.match(community,/deliberately replace your current score/);
});

test("a Hojavía 25 backfill failure cannot blank the private personal Top 10",()=>{
  const route=readFileSync(new URL("../app/api/community/route.ts",import.meta.url),"utf8");
  assert.match(route,/myTop10:communityPersonalTop10\(\[\.\.\.shapedOwnedRatings,\.\.\.smokingRatings\]\)/);
  assert.doesNotMatch(route,/if\(sync\.error\)throw sync\.error/);
});
