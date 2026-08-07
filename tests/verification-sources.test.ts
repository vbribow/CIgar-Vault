import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { FOX_CIGAR_VERIFICATION_POLICY } from "../lib/verification-sources";

const valuationResearch = readFileSync(new URL("../lib/valuation-research.ts", import.meta.url), "utf8");
const wishlistAvailability = readFileSync(new URL("../lib/wishlist-availability.ts", import.meta.url), "utf8");
const valuationPanel = readFileSync(new URL("../components/valuation-research-panel.tsx", import.meta.url), "utf8");

test("price and availability verification always check Fox Cigar without weakening evidence rules", () => {
  assert.match(FOX_CIGAR_VERIFICATION_POLICY, /search foxcigar\.com/i);
  assert.match(FOX_CIGAR_VERIFICATION_POLICY, /no usable exact listing/i);
  assert.match(FOX_CIGAR_VERIFICATION_POLICY, /not automatic proof/i);
  assert.match(FOX_CIGAR_VERIFICATION_POLICY, /infer a unit price from a collection/i);
  assert.match(valuationResearch, /\$\{FOX_CIGAR_VERIFICATION_POLICY\}/);
  assert.match(wishlistAvailability, /\$\{FOX_CIGAR_VERIFICATION_POLICY\}/);
  assert.match(valuationPanel, /Fox Cigar is checked during every verification pass/);
});
