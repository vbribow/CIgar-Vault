import assert from "node:assert/strict";
import test from "node:test";
import { wishlistNeedsMonitoring } from "../lib/wishlist-monitor";
const base={wishlistId:"WISH-1",brand:"Padrón",line:"1926",vitola:"No. 2",priority:"High" as const,targetPrice:50,status:"Watching" as const,createdAt:"2026-07-20T00:00:00.000Z"};
test("new watched targets with a price are due for monitoring",()=>assert.equal(wishlistNeedsMonitoring(base,new Date("2026-07-21T00:00:00Z")),true));
test("recently checked and inactive targets are skipped",()=>{assert.equal(wishlistNeedsMonitoring({...base,availabilityLastCheckedAt:"2026-07-20T12:00:00Z"},new Date("2026-07-21T00:00:00Z")),false);assert.equal(wishlistNeedsMonitoring({...base,status:"Purchased"},new Date("2026-07-21T00:00:00Z")),false);assert.equal(wishlistNeedsMonitoring({...base,targetPrice:undefined},new Date("2026-07-21T00:00:00Z")),false)});
