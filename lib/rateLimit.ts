import "server-only";

/**
 * Minimal in-memory rate limiter for Next.js Route Handlers.
 *
 * Designed for single-instance / single-region dev. In a multi-region
 * production setup, replace with an Upstash/Redis-backed limiter.
 *
 * Buckets are kept in a `Map<key, Bucket>`. Each bucket holds a rolling
 * counter that resets after `windowSec` of inactivity from the first hit.
 *
 * A small `gc` sweep prunes empty buckets so the map cannot grow without
 * bound under load.
 */

type Bucket = {
  count: number;
  resetAt: number; // epoch ms
};

const store = new Map<string, Bucket>();

// Periodic GC — runs every 5 minutes. Clears expired buckets.
// Unref'd so it never holds the Node process open in dev.
const GC_INTERVAL_MS = 5 * 60 * 1000;
const gcHandle: NodeJS.Timeout = setInterval(() => {
  const now = Date.now();
  for (const [k, b] of store) {
    if (b.resetAt <= now) store.delete(k);
  }
}, GC_INTERVAL_MS);
gcHandle.unref?.();

export type RateLimitOptions = {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length, in seconds. */
  windowSec: number;
};

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the bucket resets (>= 1 when not ok). */
  resetInSec: number;
};

/**
 * Increment the bucket for `key` and report whether the caller is
 * still within the limit. Always returns a `RateLimitResult` — never
 * throws.
 */
export function rateLimit(
  key: string,
  { limit, windowSec }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSec * 1000;

  let bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    const resetInMs = Math.max(0, bucket.resetAt - now);
    return {
      ok: false,
      limit,
      remaining: 0,
      resetInSec: Math.max(1, Math.ceil(resetInMs / 1000)),
    };
  }

  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetInSec: Math.max(0, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/**
 * Reset a bucket (e.g. on successful login). Optional — call this from
 * the route handler so a legitimate user is not penalised for earlier
 * bad attempts from the same IP.
 */
export function rateLimitReset(key: string): void {
  store.delete(key);
}

/**
 * Best-effort client IP from common proxy headers. Returns "unknown"
 * when no header is present, which still gives each unknown-source
 * caller its own bucket (good enough for fail-closed).
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
