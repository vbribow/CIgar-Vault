import assert from "node:assert/strict";
import test from "node:test";
import { createClientUuid } from "@/lib/client-uuid";

test("uses randomUUID when the browser exposes it", () => {
  const expected = "11111111-1111-4111-8111-111111111111";
  assert.equal(createClientUuid({ randomUUID: () => expected }), expected);
});

test("creates a valid v4 UUID when randomUUID is unavailable", () => {
  const source = {
    getRandomValues(values: Uint8Array) {
      values.fill(17);
      return values;
    },
  };

  assert.equal(createClientUuid(source), "11111111-1111-4111-9111-111111111111");
});

test("fails closed when secure browser entropy is unavailable", () => {
  assert.throws(
    () => createClientUuid(null),
    /Secure record ID generation is unavailable/,
  );
});
