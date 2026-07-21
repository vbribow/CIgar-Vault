import assert from "node:assert/strict";
import test from "node:test";
import { ValuationResearchSchema } from "../lib/valuation-research";
test("valuation research accepts traceable per-cigar evidence",()=>{const result=ValuationResearchSchema.parse({replacementValue:45,marketValue:60,source:"Auction result",sourceUrl:"https://example.com/lot",confidence:"Medium",evidenceDate:"2026-07-21",notes:"Normalized from a ten-cigar box.",comparables:[{title:"Ten-count box",url:"https://example.com/lot",unitPrice:60,notes:"$600 divided by 10"}]});assert.equal(result.marketValue,60)});
test("valuation research can decline unsupported pricing",()=>assert.equal(ValuationResearchSchema.parse({replacementValue:null,marketValue:null,source:"",sourceUrl:"",confidence:"Low",evidenceDate:"2026-07-21",notes:"Packaging is unclear.",comparables:[]}).marketValue,null));
