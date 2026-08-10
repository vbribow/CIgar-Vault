import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const component = readFileSync(new URL("components/navigation-back.tsx", root), "utf8");
const layout = readFileSync(new URL("app/layout.tsx", root), "utf8");
const styles = readFileSync(new URL("app/navigation-back.css", root), "utf8");

test("every non-home page receives a usable Back control", () => {
  assert.match(layout, /<NavigationBack\s*\/>/);
  assert.match(component, /window\.history\.back\(\)/);
  assert.match(component, /safeBackFallback/);
  assert.match(component, /> Back<\/button>/);
});

test("mobile Back remains visible below the phone safe area", () => {
  assert.match(styles, /position: sticky/);
  assert.match(styles, /safe-area-inset-top/);
  assert.match(styles, /min-height: 44px/);
});
