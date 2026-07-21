import assert from "node:assert/strict";
import test from "node:test";
import { WishlistConversionSchema,purchasedInventoryId } from "../lib/wishlist-conversion";
test("purchase conversion requires a positive quantity",()=>{assert.equal(WishlistConversionSchema.parse({wishlistId:"WISH-1",quantity:5,purchaseDate:"2026-07-21"}).quantity,5);assert.throws(()=>WishlistConversionSchema.parse({wishlistId:"WISH-1",quantity:0,purchaseDate:"2026-07-21"}))});
test("converted inventory IDs include purchase date and cigar identity",()=>{const id=purchasedInventoryId({brand:"Arturo Fuente",line:"OpusX",purchaseDate:"2026-07-21"});assert.match(id,/^INV-20260721-ARTURO-FUENTE-OPUSX-/)});
