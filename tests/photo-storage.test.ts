import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { photoBytesMatchType, safePhotoKey, storedPhotoKey } from "../lib/photo-storage";

test("inventory photo keys are isolated beneath the authenticated owner",()=>{
 const file=new File(["image"],"band.heif",{type:"image/heif"});
 const key=safePhotoKey("INV/unsafe","cigar",file,"user-123");
 assert.match(key,/^user-123\/INV-unsafe\/cigar\/.+\.jpg$/);
});

test("native Vercel photo storage does not import Cloudflare workers",()=>{
 const source=readFileSync(new URL("../lib/photo-storage.ts",import.meta.url),"utf8");
 assert.doesNotMatch(source,/cloudflare:workers/);
 assert.match(source,/inventory-photos/);
 assert.match(source,/remove\(\[key\]\)/);
});

test("a photo is removed when its inventory relationship cannot be saved",()=>{
 const route=readFileSync(new URL("../app/api/inventory/[inventoryId]/photos/route.ts",import.meta.url),"utf8");
 assert.match(route,/saveOwnedRecordIfUnchanged\("inventory",inventoryId,updated,expectedRevision\)/);
 assert.match(route,/if\(saveResult!=="saved"\)throw/);
 assert.match(route,/await bucket\.remove\(key\)\.catch/);
 assert.match(route,/throw error/);
});

test("uploaded photo content must match the declared format",()=>{
 assert.equal(photoBytesMatchType(new Uint8Array([0xff,0xd8,0xff,0x00]),"image/jpeg"),true);
 assert.equal(photoBytesMatchType(new TextEncoder().encode("%PDF-1.7"),"application/pdf"),true);
 assert.equal(photoBytesMatchType(new TextEncoder().encode("<script>"),"image/jpeg"),false);
});

test("only an owner-scoped platform photo URL can become a removal key",()=>{
 assert.equal(storedPhotoKey("https://app.example/api/photos/user-1/INV-1/cigar/photo.jpg","user-1"),"user-1/INV-1/cigar/photo.jpg");
 assert.equal(storedPhotoKey("https://app.example/api/photos/user-2/INV-1/cigar/photo.jpg","user-1"),undefined);
 assert.equal(storedPhotoKey("https://outside.example/photo.jpg","user-1"),undefined);
});

test("a successful replacement removes the prior private object",()=>{
 const route=readFileSync(new URL("../app/api/inventory/[inventoryId]/photos/route.ts",import.meta.url),"utf8");
 assert.match(route,/previousKey&&previousKey!==key/);
 assert.match(route,/bucket\.remove\(previousKey\)/);
 assert.match(route,/photoBytesMatchType\(bytes,file\.type\)/);
});
