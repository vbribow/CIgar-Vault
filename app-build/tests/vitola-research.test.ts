import assert from "node:assert/strict";
import test from "node:test";
import { physicalVitolaResearch,researchedVitolaLabel } from "../lib/vitola-research";

test("vitola research keeps sourced physical sizes and rejects product names",()=>{
  const result=physicalVitolaResearch({vitolas:[
    {name:"Double Corona",lengthInches:7.5,ringGauge:49,sourceUrl:"https://example.com/double-corona",evidence:"Official size"},
    {name:"Purple Dream",lengthInches:null,ringGauge:null,sourceUrl:"https://example.com/product",evidence:"Release name"},
  ]});
  assert.equal(result.length,1);
  assert.equal(researchedVitolaLabel(result[0]),"Double Corona — 7.5 × 49");
});
