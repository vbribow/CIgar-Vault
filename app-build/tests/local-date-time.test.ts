import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { formatLocalDateTime } from "../lib/local-date-time";

test("climate timestamps display in the collector's timezone",()=>{
  const displayed=formatLocalDateTime("2026-10-19T22:00:00.000Z","en-US","America/Phoenix");
  assert.match(displayed,/3:00 PM/);
  assert.doesNotMatch(displayed,/10:00 PM/);
});

test("invalid timestamps fail safely",()=>{
  assert.equal(formatLocalDateTime("not-a-date"),"Time unavailable");
});

test("sensor dashboard never formats time in the server timezone",async()=>{
  const source=await readFile(new URL("../components/sensor-dashboard.tsx",import.meta.url),"utf8");
  assert.match(source,/LocalDateTime/);
  assert.doesNotMatch(source,/toLocaleString/);
});
