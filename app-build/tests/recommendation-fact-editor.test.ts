import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editor = readFileSync(new URL("../components/recommendation-fact-editor.tsx", import.meta.url), "utf8");
const record = readFileSync(new URL("../app/inventory/[inventoryId]/page.tsx", import.meta.url), "utf8");

test("missing-year guidance exposes an in-context correction", () => {
  assert.match(record, /aging\.age===undefined&&<RecommendationFactEditor item=\{item\} fact="vintage"\/>/);
  assert.match(editor, /Add production or release year/);
  assert.match(editor, /Leave it blank if the year is not verified/);
});

test("recommendation correction updates the existing lot and refreshes guidance", () => {
  assert.match(editor, /fetch\(`\/api\/inventory\/\$\{encodeURIComponent\(item\.inventoryId\)\}`/);
  assert.match(editor, /method: "PUT"/);
  assert.doesNotMatch(editor, /method: "POST"/);
  assert.match(editor, /JSON\.stringify\(\{ \.\.\.item, \[fact\]: value \}\)/);
  assert.match(editor, /router\.refresh\(\)/);
  assert.match(editor, /Cedriva has refreshed this recommendation/);
});

test("release year is never guessed or auto-filled", () => {
  assert.match(editor, /defaultValue=\{item\.vintage \?\? ""\}/);
  assert.match(editor, /Enter the documented year for this exact lot/);
});
