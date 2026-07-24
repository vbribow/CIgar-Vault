import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CigarSommAnswerSchema, CigarSommQuestionSchema, cleanSommText, sommLeadSummary, uniqueSommItems } from "../lib/cigar-somm";

test("Cigar Somm accepts an inventory-grounded pairing question",()=>{const value=CigarSommQuestionSchema.parse({question:"What should I pair with this after dinner?",inventoryId:"INV-1",occasion:"After dinner",includeAlcohol:true});assert.equal(value.inventoryId,"INV-1");assert.equal(value.includeAlcohol,true)});
test("Cigar Somm accepts a manually entered cigar without adding inventory",()=>{const value=CigarSommQuestionSchema.parse({question:"Analyze this cigar",cigarName:"Arturo Fuente OpusX Lost City Double Robusto",includeAlcohol:true});assert.equal(value.cigarName,"Arturo Fuente OpusX Lost City Double Robusto");assert.equal(value.inventoryId,undefined)});
test("Cigar Somm requires either an inventory selection or manual cigar",()=>{assert.equal(CigarSommQuestionSchema.safeParse({question:"Analyze this cigar",includeAlcohol:true}).success,false)});

test("Cigar Somm answers preserve tasting analysis, personalization, four pairing paths, and sources",()=>{const pairing={name:"Espresso",style:"Medium roast",why:"Matches toasted flavors",service:"Serve warm"};const value=CigarSommAnswerSchema.parse({answer:"A balanced pairing set.",cigarContext:"Test cigar",confidence:"Medium",personalization:{used:true,signals:["Prefers medium strength"],explanation:"Adjusted to the collector's recorded taste."},tastingProfile:{body:"Medium-full",strength:"Medium",coreNotes:["cedar","cocoa"],development:["Creamy opening","Pepper builds"],evidence:"Conservative synthesis of cited reviews."},basis:["General pairing principles"],coffee:[pairing],spirits:[{...pairing,name:"Aged rum"}],cocktails:[{...pairing,name:"Rum Old Fashioned"}],nonAlcoholic:[{...pairing,name:"Sparkling mineral water"}],sources:[{title:"Official product page",url:"https://example.com/cigar",publisher:"Example Cigars",supports:"Blend composition"}],cautions:["Pairing is subjective"]});assert.equal(value.personalization.used,true);assert.equal(value.tastingProfile.coreNotes.length,2);assert.equal(value.coffee.length,1);assert.equal(value.spirits.length,1);assert.equal(value.cocktails.length,1);assert.equal(value.nonAlcoholic.length,1);assert.equal(value.sources.length,1)});

test("Cigar Somm rejects empty questions",()=>{assert.equal(CigarSommQuestionSchema.safeParse({question:""}).success,false)});
test("Cigar Somm presents verbose markdown research as a concise clean lead",()=>{
 const response='The cigar is medium to full-bodied with cedar and cocoa. ([source](https://example.com)) **Tasting Profile:** - **Body:** Medium-full - **Strength:** Medium **Pairing Recommendations:** - Espresso';
 assert.equal(sommLeadSummary(response),"The cigar is medium to full-bodied with cedar and cocoa. (source)");
 assert.equal(cleanSommText("**First Third:** Cedar [review](https://example.com)"),"First Third: Cedar review");
 assert.deepEqual(uniqueSommItems(["Intensity match","Intensity match","Flavor bridge"]),["Intensity match","Flavor bridge"]);
});

test("Cigar Somm shows research progress and releases stalled requests",()=>{
  const component=readFileSync(new URL("../components/cigar-somm.tsx",import.meta.url),"utf8");
  assert.match(component,/Researching · \$\{elapsed\}s/);
  assert.match(component,/30–90 seconds/);
  assert.match(component,/AbortSignal\.timeout\(105_000\)/);
});

test("Cigar Somm uses the fast source-aware search path for pairing requests",()=>{
  const service=readFileSync(new URL("../lib/cigar-somm.ts",import.meta.url),"utf8");
  assert.match(service,/gpt-4\.1-mini/);
  assert.match(service,/search_context_size:"low"/);
  assert.match(service,/tool_choice:"required"/);
  assert.match(service,/AbortSignal\.timeout\(60_000\)/);
});
test("Cigar Somm requests verified named spirit bottlings and discloses editorial independence",()=>{
 const library=readFileSync(new URL("../lib/cigar-somm.ts",import.meta.url),"utf8");
 const component=readFileSync(new URL("../components/cigar-somm.tsx",import.meta.url),"utf8");
 assert.match(library,/real, currently documented bottlings/);
 assert.match(library,/official producer\/importer page/);
 assert.match(component,/Specific spirits/);
 assert.match(component,/not sponsorships or endorsements/);
});
