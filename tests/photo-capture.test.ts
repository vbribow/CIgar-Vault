import assert from "node:assert/strict";
import test from "node:test";
import { maxIntakePhotoBytes, photoPreparationError, validatePhotoSelection } from "../lib/photo-capture";

const photo=(name:string,type="image/jpeg",size=1000)=>({name,type,size});

test("camera intake accepts a complete eight-view evidence set",()=>{
  assert.equal(validatePhotoSelection([photo("front.jpg"),photo("back.jpg")],Array.from({length:6},(_,index)=>photo(`view-${index}.jpg`))),null);
});

test("camera intake rejects unsupported, empty, oversized, and excess photos",()=>{
  assert.match(validatePhotoSelection([],[])||"",/No photo/);
  assert.match(validatePhotoSelection([],[photo("note.pdf","application/pdf")])||"",/not a supported photo/);
  assert.match(validatePhotoSelection([],[photo("iphone.heic","image\/heic")])||"",/Open rear camera/);
  assert.match(validatePhotoSelection([],[photo("huge.jpg","image/jpeg",maxIntakePhotoBytes+1)])||"",/smaller than 12 MB/);
  assert.match(validatePhotoSelection(Array.from({length:8},(_,index)=>photo(`${index}.jpg`)),[photo("extra.jpg")])||"",/no more than 8/);
});

test("mobile preparation failures give an actionable JPG recovery path",()=>{assert.match(photoPreparationError("IMG_1001.HEIC"),/export it as JPG/i)});
