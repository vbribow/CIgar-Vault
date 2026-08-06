import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { collector25ContributionFromSmoke } from "../lib/collector-25-contribution";
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

test("manual, mismatched, missing, and zero scores never enter Collector 25",()=>{
  assert.equal(collector25ContributionFromSmoke({...smoke,inventoryId:"MANUAL"},inventory),undefined);
  assert.equal(collector25ContributionFromSmoke(smoke,{...inventory,inventoryId:"INV-2"}),undefined);
  assert.equal(collector25ContributionFromSmoke({...smoke,overall:undefined},inventory),undefined);
  assert.equal(collector25ContributionFromSmoke({...smoke,overall:0},inventory),undefined);
});

test("smoking sync is opt-in, anonymous, deduplicated, and non-blocking",()=>{
  const helper=readFileSync(new URL("../lib/collector-25-contribution.ts",import.meta.url),"utf8");
  const route=readFileSync(new URL("../app/api/smoking-log/route.ts",import.meta.url),"utf8");
  const migration=readFileSync(new URL("../supabase/migrations/202608050001_collector_25_smoke_contributions.sql",import.meta.url),"utf8");
  assert.match(helper,/collector_25_contributions !== true/);
  assert.match(helper,/display_name: "Anonymous collector"/);
  assert.match(helper,/review: null/);
  assert.match(helper,/onConflict: "user_id,cigar_key"/);
  assert.match(helper,/catch \{[\s\S]*status: "unavailable"/);
  assert.match(route,/data: item, collector25: await syncCollector25Contribution/);
  assert.match(migration,/collector_25_contributions boolean not null default false/);
  assert.match(migration,/contribution_source in \('manual', 'smoking-journal'\)/);
  assert.match(migration,/if new\.collector_25_contributions is false/);
  assert.match(migration,/delete from public\.community_ratings[\s\S]*contribution_source = 'smoking-journal'/);
});

test("collector UX explains automation, privacy, and the manual correction path",()=>{
  const account=readFileSync(new URL("../components/account-preferences-panel.tsx",import.meta.url),"utf8");
  const journal=readFileSync(new URL("../components/records-manager.tsx",import.meta.url),"utf8");
  const community=readFileSync(new URL("../components/community-hub.tsx",import.meta.url),"utf8");
  assert.match(account,/Anonymous Collector 25 contribution/);
  assert.match(account,/tasting notes, inventory, and purchase details remain private/);
  assert.match(journal,/anonymous score updated the Hojavía 25/);
  assert.match(community,/No re-entry is needed/);
  assert.match(community,/deliberately replace your current score/);
});
