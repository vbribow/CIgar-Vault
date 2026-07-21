import assert from "node:assert/strict";
import test from "node:test";
import { cubanVerificationStatus } from "../lib/cuban-verification";

const cigar = { inventoryId:"INV-CU", brand:"Cohiba", line:"", vitola:"Robusto" };
test("loose sticks do not require box evidence",()=>assert.equal(cubanVerificationStatus({...cigar,packaging:"Individual sticks"}),"Loose sticks"));
test("box evidence requires both code and seal",()=>{assert.equal(cubanVerificationStatus({...cigar,boxCode:"ABC JAN 25"}),"Partial evidence");assert.equal(cubanVerificationStatus({...cigar,boxCode:"ABC JAN 25",habanosSealPhotoLink:"https://example.com/seal.jpg"}),"Evidence complete")});
