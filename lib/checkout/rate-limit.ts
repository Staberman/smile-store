// Best-effort, in-memory fixed-window rate limiter. State lives in a module-level
// Map, so it is per-serverless-instance only: it is a cheap FIRST layer of abuse
// defense, NOT a distributed limiter. Multiple concurrent instances each keep
// their own counters, and cold starts reset them. Pair it with upstream limits
// (WAF / platform) for anything that must hold globally.

// Numeric limits (tune here).
export const PER_KEY_LIMIT = 5;
export const PER_KEY_WINDOW_SEC = 600;
export const GLOBAL_LIMIT = 120;
export const GLOBAL_WINDOW_SEC = 60;

// Reserved key that opts a call into the global window/limit.
export const GLOBAL_KEY = "__global__";

type Bucket = { count: number; expiresAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string): { ok: boolean; retryAfterSec: number } {
  const isGlobal = key === GLOBAL_KEY;
  const limit = isGlobal ? GLOBAL_LIMIT : PER_KEY_LIMIT;
  const windowMs = (isGlobal ? GLOBAL_WINDOW_SEC : PER_KEY_WINDOW_SEC) * 1000;
  const now = Date.now();

  // Lazily evict expired windows on each call (no timers). Each bucket carries
  // its own expiry so global and per-key windows never evict each other early.
  for (const [k, b] of buckets) {
    if (now >= b.expiresAt) {
      buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);

  if (!bucket) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000));
    return { ok: false, retryAfterSec };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}
