import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function routeSource(route:string){
  return fs.readFileSync(path.join(process.cwd(),"app/api",route,"route.ts"),"utf8");
}

test("scheduled research and notification jobs pause when preferences cannot be loaded",()=>{
  for(const route of ["valuation-monitor","rating-monitor","wishlist-monitor"]){
    const source=routeSource(route);
    assert.match(source,/error:preferencesError/);
    assert.match(source,/if\(preferencesError\)throw preferencesError/);
  }
});

test("scheduled jobs retain their collector opt-out controls",()=>{
  const valuation=routeSource("valuation-monitor");
  assert.match(valuation,/valuation_research===false/);

  const ratings=routeSource("rating-monitor");
  assert.match(ratings,/rating_research===false/);

  const wishlist=routeSource("wishlist-monitor");
  assert.match(wishlist,/email_notifications!==false/);
  assert.match(wishlist,/wishlist_alerts!==false/);
});

test("voluntary product analytics pauses when its preference cannot be verified",()=>{
  const source=routeSource("product-events");
  assert.match(source,/error:preferenceError/);
  assert.match(source,/if\(preferenceError\)throw preferenceError/);
  assert.match(source,/product_analytics===false/);
});
