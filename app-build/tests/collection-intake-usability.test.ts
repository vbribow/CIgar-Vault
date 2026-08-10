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

test("heritage brand and year controls include their own search action",()=>{
  assert.match(intake,/searchBrandAndYear/);
  assert.match(intake,/Search this brand and year/);
  assert.match(intake,/disabled=\{!researchBrand\|\|researching\}/);
  assert.match(intake,/runResearch\(researchBrand,"",researchYear\)/);
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

test("a researched edition reopens its existing record and keeps lot and cigar counts distinct",()=>{
  assert.match(manager,/setEditing\(collections\.find\(collection=>collectionTemplateFor\(collection\)\?\.templateId===item\.templateId&&Number\(collection\.releaseYear\)===Number\(item\.releaseYear\)\)\)/);
  assert.match(manager,/editing\?\{"If-Match":collectionRevision\(editing,inventory\)\}/);
  assert.match(manager,/>Physical component lots</);
  assert.match(manager,/name="expectedCigars"/);
  assert.match(manager,/>Total cigars in the collection</);
  assert.match(manager,/expectedComponents:template\.expectedComponents,expectedCigars:template\.expectedCigars/);
  assert.ok(manager.includes("Number(collection.releaseYear)!==Number(template.releaseYear)"));
  assert.match(manager,/Number\(collection\.releaseYear\)===Number\(item\.releaseYear\)/);
  assert.ok(manager.includes("Number(collection.releaseYear)!==Number(template.releaseYear)"));
});

test("collector can explicitly populate exact researched rows after saving",()=>{
  assert.match(manager,/name="populateAfterSave" value="1"/);
  assert.match(manager,/Add the researched cigars to row inventory after saving/);
  assert.match(manager,/Existing standalone cigars and other release years remain separate/);
  assert.match(manager,/\/api\/collections\/\$\{encodeURIComponent\(result\.data\.collectionId\)\}\/populate/);
  assert.match(manager,/key==="populateAfterSave"/);
});

test("mobile overlays share the defensive body scroll lock",()=>{
  assert.match(navigation,/lockBodyScroll\(\)/);
  assert.match(search,/lockBodyScroll\(\)/);
  assert.doesNotMatch(navigation,/priorOverflow/);
  assert.doesNotMatch(search,/priorOverflow/);
});
