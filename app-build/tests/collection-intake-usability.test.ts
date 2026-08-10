import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const intake=readFileSync(new URL("../components/collection-research-intake.tsx",import.meta.url),"utf8");
const manager=readFileSync(new URL("../components/collections-manager.tsx",import.meta.url),"utf8");
const collectionsPage=readFileSync(new URL("../app/collections/page.tsx",import.meta.url),"utf8");
const inventoryPage=readFileSync(new URL("../app/inventory/page.tsx",import.meta.url),"utf8");
const navigation=readFileSync(new URL("../components/app-navigation.tsx",import.meta.url),"utf8");
const search=readFileSync(new URL("../components/global-search.tsx",import.meta.url),"utf8");

test("collection search state is isolated from the full Vault manager",()=>{
  assert.match(manager,/<CollectionResearchIntake/);
  assert.doesNotMatch(manager,/setResearchQuery/);
  assert.match(intake,/Typing no longer rerenders your full Vault/);
});

test("collection intake accepts photos and exposes documented contents before save",()=>{
  assert.match(intake,/>Add a collection</);
  assert.match(intake,/image\/jpeg,image\/png,image\/webp/);
  assert.match(intake,/Identify and research collection/);
  assert.match(intake,/Show documented contents/);
  assert.match(intake,/Nothing is added until you review and save it/);
});

test("Vault and collection hero expose a direct add-collection path",()=>{
  assert.match(intake,/id="add-collection"/);
  assert.match(collectionsPage,/href="#add-collection">Add a collection/);
  assert.match(inventoryPage,/href="\/collections#add-collection">Add a collection/);
});

test("mobile overlays share the defensive body scroll lock",()=>{
  assert.match(navigation,/lockBodyScroll\(\)/);
  assert.match(search,/lockBodyScroll\(\)/);
  assert.doesNotMatch(navigation,/priorOverflow/);
  assert.doesNotMatch(search,/priorOverflow/);
});
