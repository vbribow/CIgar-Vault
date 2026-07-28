import assert from "node:assert/strict";
import test from "node:test";
import { appOrigin } from "../lib/app-origin";

test("authentication callbacks prefer the stable production domain", () => {
  assert.equal(appOrigin("https://protected-preview.vercel.app", "https://hojavia.com"), "https://hojavia.com");
});

test("local authentication callbacks remain local", () => {
  assert.equal(appOrigin("http://localhost:3000/"), "http://localhost:3000");
});
