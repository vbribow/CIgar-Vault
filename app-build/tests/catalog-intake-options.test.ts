import assert from "node:assert/strict";
import test from "node:test";
import { catalogLinesForBrand, catalogVitolasForCigar } from "../lib/catalog-intake-options";
import type { CatalogCigar } from "../lib/types";

const catalog:CatalogCigar[]=[
  {catalogId:"OP4",brand:"Arturo Fuente",line:"OpusX",vitola:"PerfecXion No. 4"},
  {catalogId:"OPC",brand:"Arturo Fuente",line:"OpusX",vitola:"PerfecXion C"},
  {catalogId:"20",brand:"Arturo Fuente",line:"OpusX 20th Anniversary",vitola:"Believe"},
];

test("mobile intake finds documented vitolas across common brand and OpusX wording",()=>{
  assert.deepEqual(catalogLinesForBrand(catalog,"Arturo Fuente"),["OpusX","OpusX 20th Anniversary"]);
  assert.deepEqual(catalogVitolasForCigar(catalog,"Arturo Fuente","Fuente Fuente Opus X"),["PerfecXion C","PerfecXion No. 4"]);
  assert.deepEqual(catalogVitolasForCigar(catalog,"Arturo Fuente","Opus X 20th Anniversary"),["Believe"]);
});
