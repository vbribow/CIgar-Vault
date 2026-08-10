export class RequestTimeoutError extends Error {
  constructor(message = "This request took longer than expected.") {
    super(message);
    this.name = "RequestTimeoutError";
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 12_000,
) {
  const controller = new AbortController();
  const externalSignal = init.signal;
  let timedOut = false;
  const abortFromCaller = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) abortFromCaller();
  else externalSignal?.addEventListener("abort", abortFromCaller, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) throw new RequestTimeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", abortFromCaller);
  }
}

function isRetryableConfirmationFailure(error: unknown) {
  return error instanceof RequestTimeoutError
    || (error instanceof TypeError && /fetch|network|load failed/i.test(error.message));
}

/**
 * Repeats an idempotent mutation once when the browser loses the response.
 * Callers must reuse the same server-owned submission key on both attempts.
 */
export async function fetchWithConfirmationRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = 20_000,
) {
  try {
    return await fetchWithTimeout(input, init, timeoutMs);
  } catch (error) {
    if (!isRetryableConfirmationFailure(error) || init.signal?.aborted) throw error;
    return await fetchWithTimeout(input, init, timeoutMs);
  }
}
