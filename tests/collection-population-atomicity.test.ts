import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(
  new URL(
    "../app/api/collections/[collectionId]/populate/route.ts",
    import.meta.url,
  ),
  "utf8",
);
const userData = readFileSync(
  new URL("../lib/user-data.ts", import.meta.url),
  "utf8",
);

test("private collection population saves drafts, links, and repairs together", () => {
  assert.match(route, /const accountChanges = \[/);
  assert.match(route, /\.\.\.drafts/);
  assert.match(route, /\.\.\.reusable\.map/);
  assert.match(route, /\.\.\.repairs/);
  assert.match(route, /\.\.\.new Map/);
  assert.match(route, /saveOwnedRecordsAtomically/);
  assert.doesNotMatch(route, /Promise\.all\(drafts\.map/);
  assert.doesNotMatch(route, /saveOwnedRecord\(/);
});

test("the related-record helper uses one Supabase upsert statement", () => {
  assert.match(userData, /export async function saveOwnedRecordsAtomically/);
  assert.match(
    userData,
    /\.upsert\(rows, \{ onConflict: "user_id,kind,record_id" \}\)/,
  );
});
