import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const learn = readFileSync(new URL("../app/learn/page.tsx", import.meta.url), "utf8");
const foundations = readFileSync(new URL("../app/learn/foundations/page.tsx", import.meta.url), "utf8");
const seedToSmoke = readFileSync(new URL("../app/learn/seed-to-smoke/page.tsx", import.meta.url), "utf8");
const vitolas = readFileSync(new URL("../app/learn/vitolas/page.tsx", import.meta.url), "utf8");
const blending = readFileSync(new URL("../app/learn/blending/page.tsx", import.meta.url), "utf8");
const manufacturingTruth = readFileSync(new URL("../app/learn/manufacturing-truth/page.tsx", import.meta.url), "utf8");
const manufacturingDirectory = readFileSync(new URL("../components/manufacturing-truth-directory.tsx", import.meta.url), "utf8");
const rootProxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
const supabaseProxy = readFileSync(new URL("../lib/supabase/proxy.ts", import.meta.url), "utf8");

test("the Curious pathway opens a dedicated beginner journey", () => {
  assert.match(learn, /"\/learn\/seed-to-smoke","Follow tobacco from seed to smoke"/);
  assert.doesNotMatch(learn, /"Start without intimidation"[^\\n]*"\/catalog"/);
});

test("Seed to Smoke teaches agriculture, craft, roller development, and source distinctions", () => {
  for (const lesson of ["Seed and intention", "Soil and cultivation", "Priming and harvest", "Curing", "Fermentation and aging", "Blend and preparation", "Construction and control", "Master stewardship"]) {
    assert.match(seedToSmoke, new RegExp(lesson));
  }
  assert.match(seedToSmoke, /qualification systems differ by country, era, and factory/);
  assert.match(seedToSmoke, /not as a universal credential/);
  assert.match(seedToSmoke, /Honor the craft without turning legend into fact/);
});

test("vitola learning teaches measurement, shape, construction, and naming uncertainty", () => {
  for (const lesson of ["Length", "Ring gauge", "Parejos", "Figurados", "Petit Corona", "Robusto", "Churchill", "Lancero", "Belicoso", "Perfecto", "Salomón", "Culebra"]) {
    assert.match(vitolas, new RegExp(lesson));
  }
  assert.match(vitolas, /vitola de galera/);
  assert.match(vitolas, /vitola de salida/);
  assert.match(vitolas, /useful reference ranges—not universal laws/);
  assert.match(vitolas, /Size does not mechanically determine strength, quality, or flavor/);
  assert.match(learn, /href="\/learn\/vitolas"/);
});

test("blending learning teaches the complete discipline and uses sourced blender profiles", () => {
  for (const lesson of ["Define the intention", "Understand the leaf library", "Taste components", "Build the architecture", "Prototype and compare", "Adapt the vitola", "Prove repeatability", "Steward the blend"]) {
    assert.match(blending, new RegExp(lesson));
  }
  for (const principle of ["Strength, body, and flavor are not synonyms", "Wrapper", "Binder", "Filler", "The recipe is the blend", "Profile standard"]) {
    assert.match(blending, new RegExp(principle));
  }
  for (const blender of ["José “Pepín” García", "Jaime García", "Carlos “Carlito” Fuente Jr.", "Nicholas Melillo", "Nick Perdomo Jr.", "Néstor Andrés Plasencia", "Erik Espinosa", "Ernesto Perez-Carrillo", "Litto Gomez", "A.J. Fernandez", "Willy Herrera", "José “Jochy” Blanco", "Christian Eiroa"]) {
    assert.match(blending, new RegExp(blender));
  }
  assert.match(blending, /living blender archive · 22 studies/);
  assert.match(blending, /Industry titles vary/);
  assert.match(blending, /This is not a ranking or a hall of fame/);
  assert.match(blending, /Company claims are labeled as company claims/);
  assert.match(blending, /Documented style signals/);
  assert.match(blending, /Collaborative authorship/);
  assert.match(learn, /href="\/learn\/blending"/);
});

test("blending learning includes a sourced boutique and craft chapter", () => {
  for (const blender of ["Steve Saka", "Kyle Gellis", "Skip Martin", "Pete Johnson", "Dion Giolito", "Michael Herklots", "Francisco “Chico” Rivas", "James Brown", "Jon Huber"]) {
    assert.match(blending, new RegExp(blender));
  }
  assert.match(blending, /Boutique chapter · 9 independent and craft voices/);
  assert.match(blending, /“Boutique” has no universal production threshold/);
  assert.match(blending, /Brand founder, blender, tobacco grower, factory owner, and production partner may be different people/);
  assert.match(blending, /availability alone proves neither craftsmanship nor quality/);
  assert.match(blending, /honoring the factory, rollers, tobacco teams, and blender/);
});

test("every blender profile identifies who manufactures the cigars", () => {
  assert.equal(blending.match(/manufacturing:/g)?.length, 22);
  assert.equal(blending.match(/factorySource:/g)?.length, 22);
  assert.match(blending, /The name on the band may not be the name over the factory door/);
  assert.match(blending, /Who makes the cigars\?/);
  assert.match(blending, /manufacturer by release period instead of silently rewriting history/);
  assert.match(blending, /If the factory is undisclosed or unverified, Cedriva says exactly that/);
  for (const manufacturer of ["My Father Cigars S.A.", "Tabacalera A. Fuente y Cia.", "Tabacalera A.J. Fernandez", "La Zona", "Casa Carrillo", "La Gran Fabrica Drew Estate", "Tabacalera Palma", "Joya de Nicaragua", "El Titan de Bronze", "Nica Sueño", "TABSA", "Raíces Cubanas", "Plasencia", "Quesada", "Fábrica Oveja Negra", "Tabacalera Pichardo", "NACSA"]) {
    assert.match(blending, new RegExp(manufacturer));
  }
  assert.match(blending, /Manufactura Rivas/);
  assert.match(blending, /authorship hidden behind the band/);
  assert.match(blending, /Open manufacturing truth/);
  assert.match(blending, /profileTrustLabel/);
});

test("blending learning explains how leaf identity, cultivation, and processing affect taste", () => {
  for (const lesson of ["Seed", "Terroir", "Priming", "Volado", "Seco", "Viso", "Ligero", "Medio tiempo", "Shade-grown", "Sun-grown", "What is a Maduro?", "Connecticut Shade", "Connecticut Broadleaf", "Habano", "Corojo", "Cameroon", "Sumatra", "Mexican San Andrés"]) {
    assert.match(blending, new RegExp(lesson, "i"));
  }
  assert.match(blending, /The binder is part of the flavor system/);
  assert.match(blending, /no honest universal percentage/);
  assert.match(blending, /It is not one seed/);
  assert.match(blending, /It is not merely a color/);
  assert.match(blending, /It is not automatically strong/);
  assert.match(blending, /common collector and producer associations, not a flavor guarantee/);
});

test("foundations teach the complete first-cigar experience in plain language", () => {
  for (const lesson of ["Choose with confidence", "Know what you are holding", "Cut only what you need", "Light patiently", "Slow down and notice", "Store what remains", "Handle common problems calmly", "Share the culture respectfully"]) {
    assert.match(foundations, new RegExp(lesson));
  }
  assert.match(foundations, /Strength and flavor are not the same thing/);
  assert.match(foundations, /Questions are part of the culture/);
  assert.match(foundations, /intended only for adults of legal age/);
});

test("learning routes form a connected curriculum around manufacturing truth", () => {
  assert.match(learn, /href="\/learn\/manufacturing-truth"/);
  assert.match(seedToSmoke, /href="\/learn\/blending"/);
  assert.match(seedToSmoke, /href="\/learn\/manufacturing-truth"/);
  assert.match(vitolas, /href="\/learn\/blending"/);
  assert.match(vitolas, /href="\/learn\/manufacturing-truth"/);
  assert.match(blending, /href="\/learn\/manufacturing-truth"/);
  assert.match(manufacturingTruth, /ManufacturingTruthDirectory/);
  assert.match(manufacturingTruth, /Brand owner/);
  assert.match(manufacturingTruth, /Actual factory/);
  assert.match(manufacturingTruth, /Release/);
  assert.match(manufacturingTruth, /Provenance/);
  assert.match(manufacturingTruth, /Complete Cedriva brand universe/);
  assert.match(manufacturingTruth, /allBrandManufacturingCoverage/);
  assert.match(manufacturingTruth, /No cigar disappears because its factory is unknown/);
  assert.match(manufacturingDirectory, /Choose a cigar manufacturer/);
  assert.match(manufacturingDirectory, /records\.map\(\(record\) => <option/);
  assert.match(manufacturingDirectory, /All manufacturers/);
});

test("the complete Cedriva learning curriculum remains publicly accessible", () => {
  assert.match(rootProxy, /pathname\.startsWith\("\/learn\/"\)/);
  assert.match(supabaseProxy, /pathname\.startsWith\("\/learn\/"\)/);
});
