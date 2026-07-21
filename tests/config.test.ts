import assert from "node:assert/strict";
import test from "node:test";
import { dataMode } from "../lib/config";

test("explicit mock mode wins", () => {
  const previous = process.env.USE_MOCK_DATA;
  process.env.USE_MOCK_DATA = "true";
  assert.equal(dataMode(), "mock");
  if (previous === undefined) delete process.env.USE_MOCK_DATA; else process.env.USE_MOCK_DATA = previous;
});

test("explicit Smartsheet mode wins", () => {
  const previous = process.env.USE_MOCK_DATA;
  process.env.USE_MOCK_DATA = "false";
  assert.equal(dataMode(), "smartsheet");
  if (previous === undefined) delete process.env.USE_MOCK_DATA; else process.env.USE_MOCK_DATA = previous;
});
