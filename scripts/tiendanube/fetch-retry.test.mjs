import assert from "node:assert/strict";
import test from "node:test";
import { RETRY_DELAYS_MS, fetchTextWithRetry, isRetryableStatus } from "./fetch-retry.mjs";

const page = "<html>producto</html>";
const ok = () => ({ ok: true, status: 200, text: async () => page });
const status = (code) => () => ({ ok: false, status: code, text: async () => "" });
const throws = (error) => () => {
  throw error;
};
const timeout = () => new DOMException("The operation was aborted due to timeout", "TimeoutError");
const networkError = () => new TypeError("fetch failed", { cause: { code: "ECONNRESET" } });

// A fetch that plays `responses` in order and records each call, plus a sleep
// that records the pauses instead of waiting.
function scripted(...responses) {
  const calls = [];
  const pauses = [];
  return {
    calls,
    pauses,
    options: {
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return responses[calls.length - 1]();
      },
      sleep: async (ms) => {
        pauses.push(ms);
      },
    },
  };
}

test("a transient 503 is retried after a short pause and the page is read", async () => {
  const fetch = scripted(status(503), ok);
  const retries = [];

  const text = await fetchTextWithRetry("https://tienda/p/", {
    ...fetch.options,
    onRetry: (retry) => retries.push(retry),
  });

  assert.equal(text, page);
  assert.equal(fetch.calls.length, 2);
  assert.deepEqual(fetch.pauses, [RETRY_DELAYS_MS[0]]);
  assert.deepEqual(retries, [{ attempt: 1, reason: "HTTP 503", delayMs: 2_000 }]);
});

test("429, 5xx, network errors and timeouts are all retried, with growing pauses", async () => {
  const fetch = scripted(status(429), throws(networkError()), throws(timeout()));
  await assert.rejects(fetchTextWithRetry("https://tienda/p/", fetch.options));
  assert.deepEqual(fetch.pauses, [2_000, 5_000]);

  for (const failure of [status(500), status(502), throws(networkError()), throws(timeout())]) {
    const recovered = scripted(failure, ok);
    assert.equal(await fetchTextWithRetry("https://tienda/p/", recovered.options), page);
    assert.equal(recovered.calls.length, 2);
  }
});

test("a persistent failure gives up after three attempts and says so", async () => {
  const fetch = scripted(status(503), status(503), status(503), ok);

  await assert.rejects(fetchTextWithRetry("https://tienda/p/", fetch.options), {
    message: "HTTP 503, tras 3 intentos",
  });
  assert.equal(fetch.calls.length, 3);

  const silent = scripted(throws(timeout()), throws(timeout()), throws(timeout()));
  await assert.rejects(fetchTextWithRetry("https://tienda/p/", silent.options), {
    message: "sin respuesta en 8 s, tras 3 intentos",
  });

  const offline = scripted(throws(networkError()), throws(networkError()), throws(networkError()));
  await assert.rejects(fetchTextWithRetry("https://tienda/p/", offline.options), {
    message: "fetch failed (ECONNRESET), tras 3 intentos",
  });
});

test("client errors other than 429 fail at once, without retrying", async () => {
  for (const code of [400, 403, 404, 410]) {
    const fetch = scripted(status(code), ok);
    await assert.rejects(fetchTextWithRetry("https://tienda/p/", fetch.options), {
      message: `HTTP ${code}`,
    });
    assert.equal(fetch.calls.length, 1, `HTTP ${code}`);
    assert.deepEqual(fetch.pauses, []);
  }
});

test("each attempt sends the headers and its own timeout signal", async () => {
  const fetch = scripted(status(503), ok);
  await fetchTextWithRetry("https://tienda/p/", {
    ...fetch.options,
    headers: { "User-Agent": "Smile Stock Sync" },
  });

  for (const { url, init } of fetch.calls) {
    assert.equal(url, "https://tienda/p/");
    assert.deepEqual(init.headers, { "User-Agent": "Smile Stock Sync" });
    assert.ok(init.signal instanceof AbortSignal);
  }
  assert.notEqual(fetch.calls[0].init.signal, fetch.calls[1].init.signal);
});

test("isRetryableStatus covers 429 and 5xx only", () => {
  for (const code of [429, 500, 502, 503, 504, 599]) assert.equal(isRetryableStatus(code), true);
  for (const code of [200, 301, 400, 401, 403, 404, 410, 600]) {
    assert.equal(isRetryableStatus(code), false);
  }
});
