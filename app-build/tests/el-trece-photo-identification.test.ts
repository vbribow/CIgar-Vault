import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { curatedCatalogSeeds, photoIdentificationHints } from "../lib/catalog-curated-seeds";

test("El Trece preserves the collector-observed 24-count conflict", () => {
  const item = curatedCatalogSeeds.find((candidate) => candidate.vitola === "El Trece Magistral 13");
  assert.equal(item?.brand, "Arturo Fuente");
  assert.match(item?.packaging || "", /24 cigars/);
  assert.match(item?.packaging || "", /state 26/);
  assert.match(item?.correctionNotes || "", /Do not normalize/);
  assert.ok(photoIdentificationHints.some((hint) => /Fuente El Trece Magistral/.test(hint)));
});

test("photo analysis receives typed context and waits for the server result", () => {
  const intake = readFileSync(new URL("../components/photo-inventory-intake.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/photo-identification/route.ts", import.meta.url), "utf8");
  assert.match(intake, /form\.set\("context",query\.trim\(\)\)/);
  assert.match(intake, /85_000/);
  assert.match(route, /photoIdentificationHints/);
  assert.match(route, /collector-confirmed count/);
});
