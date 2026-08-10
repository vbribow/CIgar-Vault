import assert from "node:assert/strict";
import test from "node:test";
import { fetchWithConfirmationRetry } from "../lib/request-control";

test("a lost mutation response is retried exactly once with the unchanged request", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    if (calls.length === 1) throw new TypeError("Failed to fetch");
    return new Response(JSON.stringify({ data: { smokeId: "SMK-TEST" }, retry: true }), { status: 200 });
  }) as typeof fetch;

  try {
    const init = { method: "POST", body: JSON.stringify({ submissionId: "same-id" }) };
    const response = await fetchWithConfirmationRetry("/api/smoking-log", init, 100);
    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.input, calls[1]?.input);
    assert.equal(calls[0]?.init?.body, calls[1]?.init?.body);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a confirmed server rejection is not retried", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response(JSON.stringify({ error: "Validation failed" }), { status: 422 });
  }) as typeof fetch;

  try {
    const response = await fetchWithConfirmationRetry("/api/smoking-log", { method: "POST" }, 100);
    assert.equal(response.status, 422);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
