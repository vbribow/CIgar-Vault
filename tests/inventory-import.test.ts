import test from "node:test";
import assert from "node:assert/strict";
import { parseInventoryFile } from "../lib/inventory-import";

test("previews safe CSV inventory and detects duplicates",async()=>{
 const csv=Buffer.from("Manufacturer,Series,Size,Quantity,Release Year\nCohiba,Siglo IV,Corona Gorda,20,2025\nCohiba,Siglo IV,Corona Gorda,20,2025");
 const result=await parseInventoryFile("vault.csv",csv,[]);
 assert.equal(result.valid,2);assert.equal(result.duplicates,1);assert.equal(result.rows[0].item?.currentQty,20);assert.equal(result.rows[0].item?.brand,"Cohiba");
});

test("rejects spreadsheet formulas before preview",async()=>{
 const csv=Buffer.from("Brand,Vitola,Quantity\n=IMPORTXML(1),Robusto,5");
 const result=await parseInventoryFile("unsafe.csv",csv,[]);
 assert.equal(result.invalid,1);assert.match(result.rows[0].errors[0],/Formula-like/);
});

test("rejects macro-enabled and oversized import formats",async()=>{
 await assert.rejects(()=>parseInventoryFile("vault.xlsm",Buffer.from("test"),[]),/Only .csv and .xlsx/);
 await assert.rejects(()=>parseInventoryFile("renamed.xlsx",Buffer.from("PK vbaProject.bin"),[]),/macros/);
});

test("unreadable workbooks fail closed with an actionable message",async()=>{
 await assert.rejects(()=>parseInventoryFile("damaged.xlsx",Buffer.from([0x50,0x4b,0x03,0x04]),[]),/could not be read safely.*standard \.xlsx/i);
});

test("rejects malformed and non-UTF-8 CSV before preview",async()=>{
 await assert.rejects(()=>parseInventoryFile("unclosed.csv",Buffer.from('Brand,Vitola,Quantity\n"Cohiba,Robusto,5'),[]),/unclosed quoted value/);
 await assert.rejects(()=>parseInventoryFile("encoded.csv",Buffer.from([0x42,0x72,0x61,0x6e,0x64,0x2c,0xff]),[]),/valid UTF-8/);
});
