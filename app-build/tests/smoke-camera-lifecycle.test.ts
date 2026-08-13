import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manager=readFileSync(new URL("../components/records-manager.tsx",import.meta.url),"utf8");

test("a completed smoke invalidates stale photo work and remounts the native mobile camera control",()=>{
  assert.match(manager,/smokePhotoRequest\.current \+= 1;[\s\S]*setSmokeCameraSession\(current=>current\+1\)/);
  assert.match(manager,/key=\{`smoke-camera-\$\{smokeCameraSession\}`\}/);
  assert.match(manager,/image\.onload=null;image\.onerror=null;image\.src="";URL\.revokeObjectURL/);
});

test("saving cannot race an active photo preparation or identification request",()=>{
  assert.match(manager,/fieldset disabled=\{smokeMutation\.pending \|\| smokeMutation\.complete \|\| smokePhotoBusy\}/);
  assert.match(manager,/smokeQuantityBlocked \|\| smokePhotoBusy \|\| smokeMutation\.pending/);
  assert.match(manager,/finally \{ if \(requestId === smokePhotoRequest\.current\) setSmokePhotoBusy\(false\); \}/);
});
