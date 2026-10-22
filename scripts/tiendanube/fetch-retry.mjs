// Reads a public page, retrying the failures that usually clear on their own
// (network errors, timeouts, 429, 5xx), so one hiccup doesn't fail a sync.

// Pauses before the 2nd and 3rd attempts. With the per-attempt timeout, a page
// that never answers gives up after 3 × 8 s + 2 s + 5 s = 31 s; pages are read
// in parallel, so the whole step stays well under a minute.
export const RETRY_DELAYS_MS = Object.freeze([2_000, 5_000]);
export const ATTEMPT_TIMEOUT_MS = 8_000;

// 429 and 5xx mean "come back later"; any other HTTP error (404 for a removed
// product, 403…) won't change by asking again.
export function isRetryableStatus(status) {
  return status === 429 || (status >= 500 && status <= 599);
}

class HttpStatusError extends Error {
  constructor(status) {
    super(`HTTP ${status}`);
    this.retryable = isRetryableStatus(status);
  }
}

function describeFailure(error, timeoutMs) {
  if (error?.name === "TimeoutError") return `sin respuesta en ${timeoutMs / 1000} s`;
  const code = error?.cause?.code;
  return code ? `${error.message} (${code})` : String(error?.message ?? error);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GETs `url` and returns the body text. Network errors, timeouts, 429 and 5xx
 * are retried after each of `retryDelaysMs`; any other HTTP error fails at
 * once. The thrown error names the last failure and, after retries, how many
 * attempts were made. `onRetry({ attempt, reason, delayMs })` runs before
 * each pause.
 */
export async function fetchTextWithRetry(
  url,
  {
    headers = {},
    fetchImpl = fetch,
    sleep = wait,
    retryDelaysMs = RETRY_DELAYS_MS,
    timeoutMs = ATTEMPT_TIMEOUT_MS,
    onRetry = () => {},
  } = {},
) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
      if (response.ok) return await response.text();
      await response.body?.cancel().catch(() => {});
      throw new HttpStatusError(response.status);
    } catch (error) {
      const reason = describeFailure(error, timeoutMs);
      const retryable = !(error instanceof HttpStatusError) || error.retryable;
      if (!retryable || attempt > retryDelaysMs.length) {
        throw new Error(attempt === 1 ? reason : `${reason}, tras ${attempt} intentos`);
      }
      const delayMs = retryDelaysMs[attempt - 1];
      onRetry({ attempt, reason, delayMs });
      await sleep(delayMs);
    }
  }
}
