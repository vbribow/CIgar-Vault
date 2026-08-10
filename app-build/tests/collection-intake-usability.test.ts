import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const intake=readFileSync(new URL("../components/collection-research-intake.tsx",import.meta.url),"utf8");
const manager=readFileSync(new URL("../components/collections-manager.tsx",import.meta.url),"utf8");
const navigation=readFileSync(new URL("../components/app-navigation.tsx",import.meta.url),"utf8");
const search=readFileSync(new URL("../components/global-search.tsx",import.meta.url),"utf8");

test("collection search state is isolated from the full Vault manager",()=>{
  assert.match(manager,/<CollectionResearchIntake/);
  assert.doesNotMatch(manager,/setResearchQuery/);
  assert.match(intake,/Typing no longer rerenders your full Vault/);
});

test("collection intake accepts photos and exposes documented contents before save",()=>{
  assert.match(intake,/Add a collection from photos/);
  assert.match(intake,/image\/jpeg,image\/png,image\/webp/);
  assert.match(intake,/Identify and research collection/);
  assert.match(intake,/Show documented contents/);
  assert.match(intake,/Nothing is added until you review and save it/);
});

test("mobile overlays share the defensive body scroll lock",()=>{
  assert.match(navigation,/lockBodyScroll\(\)/);
  assert.match(search,/lockBodyScroll\(\)/);
  assert.doesNotMatch(navigation,/priorOverflow/);
  assert.doesNotMatch(search,/priorOverflow/);
});
