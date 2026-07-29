import assert from "node:assert/strict";
import test from "node:test";
import { createServerRecordId } from "../lib/server-record-id";
import { ValuationCreateSchema } from "../lib/records-model";
import { SensorCreateSchema } from "../lib/sensor-model";
import { HumidorCreateSchema, HumidorReadingCreateSchema } from "../lib/humidor-model";
import { CollectionCreateInputSchema } from "../lib/collection-model";
import { WishlistCreateSchema } from "../lib/wishlist-model";
import { ProfessionalRatingCreateSchema } from "../lib/cigar-ratings";

const retryId="11111111-1111-4111-8111-111111111111";

test("trusted IDs are deterministic for retries and separated by record kind",()=>{
  assert.equal(createServerRecordId("valuation",retryId),createServerRecordId("valuation",retryId));
  assert.notEqual(createServerRecordId("valuation",retryId),createServerRecordId("sensor",retryId));
  assert.match(createServerRecordId("valuation",retryId),/^VAL-[A-F0-9]{20}$/);
});

test("collector valuation create input omits and rejects valuationId",()=>{
  const input={inventoryId:"INV-0053",valuationDate:"2026-07-27",marketEvidenceType:"Insufficient evidence",submissionId:retryId};
  assert.equal(ValuationCreateSchema.safeParse(input).success,true);
  assert.equal(ValuationCreateSchema.safeParse({...input,valuationId:"VAL-HOSTILE"}).success,false);
});

test("collector sensor, humidor, reading, and collection creates do not require IDs",()=>{
  const sensor={humidorId:"HUM-EXISTING",provider:"Tempi",name:"Main cabinet",syncMethod:"CSV import",connectionStatus:"Ready",submissionId:retryId};
  assert.equal(SensorCreateSchema.safeParse(sensor).success,true);
  assert.equal(SensorCreateSchema.safeParse({...sensor,sensorId:"SENSOR-HOSTILE"}).success,false);
  const humidor={name:"Main cabinet",targetTempF:68,minTempF:65,maxTempF:71,targetHumidity:67,minHumidity:64,maxHumidity:70,memberIds:[],submissionId:retryId};
  assert.equal(HumidorCreateSchema.safeParse(humidor).success,true);
  assert.equal(HumidorCreateSchema.safeParse({...humidor,humidorId:"HUM-HOSTILE"}).success,false);
  const reading={humidorId:"HUM-EXISTING",recordedAt:"2026-07-27T12:00",temperatureF:68,humidity:67,submissionId:retryId};
  assert.equal(HumidorReadingCreateSchema.safeParse(reading).success,true);
  assert.equal(HumidorReadingCreateSchema.safeParse({...reading,readingId:"READ-HOSTILE"}).success,false);
  assert.equal(CollectionCreateInputSchema.safeParse({name:"Custom collection",releaseYear:2026,memberIds:[],submissionId:retryId}).success,true);
  const wishlist={brand:"Arturo Fuente",line:"Don Carlos",vitola:"Robusto",priority:"High",status:"Watching",createdAt:"2026-07-27T12:00:00.000Z",submissionId:retryId};
  assert.equal(WishlistCreateSchema.safeParse(wishlist).success,true);
  assert.equal(WishlistCreateSchema.safeParse({...wishlist,wishlistId:"WISH-HOSTILE"}).success,false);
  const rating={inventoryId:"INV-0053",publication:"Example",score:92,sourceUrl:"https://example.com/review",matchConfidence:"High",createdAt:"2026-07-27T12:00:00.000Z",submissionId:retryId};
  assert.equal(ProfessionalRatingCreateSchema.safeParse(rating).success,true);
  assert.equal(ProfessionalRatingCreateSchema.safeParse({...rating,ratingId:"RATE-HOSTILE"}).success,false);
});

test("stored legacy schemas continue preserving their canonical IDs",()=>{
  assert.equal(ValuationCreateSchema.safeParse({valuationId:"VAL-0001",inventoryId:"INV-0053",valuationDate:"2026-07-27"}).success,false);
});

test("collector forms no longer render editable technical ID fields",async()=>{
  const fs=await import("node:fs/promises");
  const [records,sensors,humidors,collections,inventory]=await Promise.all([
    fs.readFile(new URL("../components/records-manager.tsx",import.meta.url),"utf8"),
    fs.readFile(new URL("../components/sensor-manager.tsx",import.meta.url),"utf8"),
    fs.readFile(new URL("../components/humidor-manager.tsx",import.meta.url),"utf8"),
    fs.readFile(new URL("../components/collections-manager.tsx",import.meta.url),"utf8"),
    fs.readFile(new URL("../components/inventory-manager.tsx",import.meta.url),"utf8"),
  ]);
  assert.doesNotMatch(records,/name="valuationId"/);
  assert.doesNotMatch(sensors,/<input name="sensorId"/);
  assert.doesNotMatch(humidors,/<span>Humidor ID<\/span>/);
  assert.doesNotMatch(collections,/<span>Collection ID/);
  assert.doesNotMatch(inventory,/<span>Inventory reference<\/span>/);
});
