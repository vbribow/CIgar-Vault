import assert from "node:assert/strict";
import test from "node:test";
import { WishlistItemSchema,wishlistIdFor } from "../lib/wishlist-model";
test("wishlist accepts a tracked acquisition target",()=>{const item=WishlistItemSchema.parse({wishlistId:"WISH-1",brand:"Padrón",line:"1926 Serie",vitola:"No. 2",priority:"High",targetPrice:75,status:"Watching",createdAt:"2026-07-21T00:00:00.000Z"});assert.equal(item.targetPrice,75)});
test("wishlist ids are stable for the same target",()=>{const target={collectionId:"COL-1",brand:"Padrón",line:"1926 Serie",vitola:"No. 2"};assert.equal(wishlistIdFor(target),wishlistIdFor(target))});
