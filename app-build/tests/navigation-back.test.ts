import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const component = readFileSync(new URL("components/navigation-back.tsx", root), "utf8");
const layout = readFileSync(new URL("app/layout.tsx", root), "utf8");
const navigation = readFileSync(new URL("components/app-navigation.tsx", root), "utf8");
const styles = readFileSync(new URL("app/navigation-back.css", root), "utf8");

test("every non-home page receives the shared Back control", () => {
  assert.match(layout, /<NavigationBack\s*\/>/);
  assert.match(component, /if\(pathname==="\/"\)return null/);
  assert.match(component, /> Back<\/button>/);
});

test("Back uses internal history and safe direct-load fallbacks", () => {
  assert.match(component, /window\.history\.back\(\)/);
  assert.match(component, /window\.location\.assign\(safeBackFallback\(pathname\)\)/);
  assert.match(component, /pathname\.startsWith\("\/inventory\/"\)/);
  assert.match(component, /return "\/inventory"/);
});

test("shared navigation remembers same-origin journeys without trapping external links", () => {
  assert.match(navigation, /addEventListener\("click",rememberInternalNavigation,true\)/);
  assert.match(component, /link\.target==="_blank"/);
  assert.match(component, /link\.origin!==window\.location\.origin/);
  assert.match(component, /previous-internal-path/);
});

test("mobile Back control is touch-sized and remains visible below the safe area", () => {
  assert.match(styles, /position: sticky/);
  assert.match(styles, /safe-area-inset-top/);
  assert.match(styles, /min-height: 44px/);
  assert.match(styles, /focus-visible/);
});
