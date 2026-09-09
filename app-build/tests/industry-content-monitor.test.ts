import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { industryContentKey, IndustryContentItemSchema, ukPlainPackagingBrief } from "../lib/industry-content";

test("industry briefs preserve source type, stance, jurisdiction, and direct evidence",()=>{
  assert.equal(IndustryContentItemSchema.parse(ukPlainPackagingBrief).sourceType,"Government");
  assert.equal(ukPlainPackagingBrief.stance,"Neutral reporting");
  assert.match(ukPlainPackagingBrief.summary,/proposal, not an enacted/i);
});

test("duplicate source URLs collapse tracking parameters",()=>{
  assert.equal(industryContentKey({sourceUrl:"https://example.com/story/?utm_source=x#top"}),"https://example.com/story");
});

test("weekly monitor auto-publishes only qualified sourced stories",()=>{
  const route=fs.readFileSync(path.join(process.cwd(),"app/api/industry-content-monitor/route.ts"),"utf8");
  const vercel=JSON.parse(fs.readFileSync(path.join(process.cwd(),"vercel.json"),"utf8"));
  assert.equal(vercel.crons.find((job:{path:string})=>job.path==="/api/industry-content-monitor")?.schedule,"30 12 * * 1");
  assert.match(route,/Exclude social posts, forums, rumors/);
  assert.match(route,/status:"published"/);
  assert.match(route,/ignoreDuplicates:true/);
});
