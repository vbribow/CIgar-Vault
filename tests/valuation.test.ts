import assert from "node:assert/strict";
import test from "node:test";
import { lotRetailValue } from "../lib/valuation";

test("lot value multiplies unit retail by user quantity", () => {
  assert.equal(lotRetailValue({ retailValue: 22.7, currentQty: 10 }), 227);
});

test("lot value remains unknown when price or quantity is missing", () => {
  assert.equal(lotRetailValue({ retailValue: 22.7 }), undefined);
  assert.equal(lotRetailValue({ currentQty: 10 }), undefined);
});
