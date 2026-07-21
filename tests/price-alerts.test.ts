import assert from "node:assert/strict";
import test from "node:test";
import { findPriceMatches,unalertedPriceMatches } from "../lib/price-alerts";
const base={seller:"Dealer",sellerType:"Authorized retailer" as const,title:"Cigar",url:"https://example.com/cigar",availability:"In stock" as const,notes:"Direct listing"};
test("matches reliable per-cigar prices at or below target",()=>{const matches=findPriceMatches([{...base,askingPrice:200,quantity:10,unitPrice:20}],25);assert.equal(matches.length,1);assert.equal(matches[0].price,20)});
test("does not compare unnormalized box totals to per-cigar targets",()=>{assert.equal(findPriceMatches([{...base,askingPrice:200,quantity:10}],25).length,0)});
test("does not repeat already delivered listing alerts",()=>{const matches=findPriceMatches([{...base,askingPrice:20,quantity:1}],25);assert.equal(unalertedPriceMatches(matches,[base.url]).length,0)});
