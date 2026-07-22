import assert from "node:assert/strict";
import test from "node:test";
import { CigarSommAnswerSchema, CigarSommQuestionSchema } from "../lib/cigar-somm";

test("Cigar Somm accepts an inventory-grounded pairing question",()=>{const value=CigarSommQuestionSchema.parse({question:"What should I pair with this after dinner?",inventoryId:"INV-1",occasion:"After dinner",includeAlcohol:true});assert.equal(value.inventoryId,"INV-1");assert.equal(value.includeAlcohol,true)});

test("Cigar Somm answers preserve coffee, spirits, and nonalcoholic paths",()=>{const pairing={name:"Espresso",style:"Medium roast",why:"Matches toasted flavors",service:"Serve warm"};const value=CigarSommAnswerSchema.parse({answer:"A balanced pairing set.",cigarContext:"Test cigar",confidence:"Medium",basis:["General pairing principles"],coffee:[pairing],spirits:[{...pairing,name:"Aged rum"}],nonAlcoholic:[{...pairing,name:"Sparkling mineral water"}],cautions:["Pairing is subjective"]});assert.equal(value.coffee.length,1);assert.equal(value.spirits.length,1);assert.equal(value.nonAlcoholic.length,1)});

test("Cigar Somm rejects empty questions",()=>{assert.equal(CigarSommQuestionSchema.safeParse({question:""}).success,false)});
