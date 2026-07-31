import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("installed iPhone headers keep controls below the translucent status bar", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/styles.css", import.meta.url), "utf8");

  assert.match(layout, /statusBarStyle:"black-translucent"/);
  assert.match(layout, /viewportFit:"cover"/);
  assert.match(
    styles,
    /\.appHeaderInner\{[^}]*padding:calc\(12px \+ env\(safe-area-inset-top\)\) 22px 12px/,
  );
  assert.match(
    styles,
    /\.publicHeaderInner\{[^}]*padding:calc\(13px \+ env\(safe-area-inset-top\)\) 24px 13px/,
  );
  assert.ok(
    (styles.match(/padding:calc\(10px \+ env\(safe-area-inset-top\)\)/g) ?? []).length >= 3,
    "every compact header override must preserve the iPhone top inset",
  );
  assert.match(
    styles,
    /\.appHeaderInner\{padding:calc\(10px \+ env\(safe-area-inset-top\)\) 16px 10px\}/,
  );
  assert.match(
    styles,
    /@media\(max-width:600px\)\{\.publicHeaderInner\{padding:calc\(10px \+ env\(safe-area-inset-top\)\) 15px 10px\}/,
  );
});
