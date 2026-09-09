import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("automated valuation monitoring runs monthly",()=>{
  const vercel=JSON.parse(fs.readFileSync(path.join(process.cwd(),"vercel.json"),"utf8"));
  const job=vercel.crons.find((entry:{path:string})=>entry.path==="/api/valuation-monitor");
  assert.equal(job?.schedule,"15 13 1 * *");
});

test("Bond Roberts is an explicit New World completed-sale research source",()=>{
  const auction=fs.readFileSync(path.join(process.cwd(),"lib/auction-market.ts"),"utf8");
  const research=fs.readFileSync(path.join(process.cwd(),"lib/valuation-research.ts"),"utf8");
  assert.match(auction,/Bond Roberts.*Cuban and New World collectible cigars/);
  assert.match(auction,/reserve-not-met.*not sales/i);
  assert.match(research,/Check Bond Roberts for an exact completed lot for both Cuban and New World/);
  assert.match(research,/buyer.s premium is included/);
});
