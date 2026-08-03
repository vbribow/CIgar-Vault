import assert from "node:assert/strict";
import test from "node:test";
import { productDomains } from "../lib/product-domains";

test("Hojavía exposes the nine connected product domains",()=>{
  assert.deepEqual(productDomains.map(domain=>domain.id),["discover","vault","review","market","verify","community","learn","ai","reserve"]);
  assert.equal(new Set(productDomains.map(domain=>domain.href)).size,9);
});

test("every product domain has a collector promise and reachable destinations",()=>{
  for(const domain of productDomains){
    assert.ok(domain.promise.length>20);
    assert.ok(domain.links.length>0);
    assert.ok(domain.links.every(link=>link.href.startsWith("/")&&link.description.length>10));
  }
});

test("Reserve accurately describes its subscription-level destination",()=>{
  const reserve=productDomains.find(domain=>domain.id==="reserve");
  assert.equal(reserve?.href,"/pricing");
  assert.equal(reserve?.actionLabel,"View membership options →");
});
