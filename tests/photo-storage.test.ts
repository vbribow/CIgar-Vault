import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { safePhotoKey } from "../lib/photo-storage";

test("inventory photo keys are isolated beneath the authenticated owner",()=>{
 const file=new File(["image"],"band.heif",{type:"image/heif"});
 const key=safePhotoKey("INV/unsafe","cigar",file,"user-123");
 assert.match(key,/^user-123\/INV-unsafe\/cigar\/.+\.heif$/);
});

test("native Vercel photo storage does not import Cloudflare workers",()=>{
 const source=readFileSync(new URL("../lib/photo-storage.ts",import.meta.url),"utf8");
 assert.doesNotMatch(source,/cloudflare:workers/);
 assert.match(source,/inventory-photos/);
});
