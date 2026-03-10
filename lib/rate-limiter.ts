/**
 * In-memory token-bucket rate limiter for API routes.
 * In production, replace the store with a Redis client for multi-instance deployments.
 */

type BucketEntry = {
  tokens: number;
  lastRefill: number;
};

const store = new Map<string, BucketEntry>();

export type RateLimitConfig = {
  /** Maximum tokens in the bucket (= max burst). */
  capacity: number;
  /** Tokens added per second (refill rate). */
  refillRate: number;
};

const PRESETS = {
  auth: { capacity: 10, refillRate: 1 / 30 } satisfies RateLimitConfig,
  llm: { capacity: 5, refillRate: 1 / 60 } satisfies RateLimitConfig,
  general: { capacity: 60, refillRate: 1 } satisfies RateLimitConfig
} as const;

export type RateLimitPreset = keyof typeof PRESETS;

export function checkRateLimit(
  key: string,
  preset: RateLimitPreset = "general"
): { allowed: boolean; retryAfterSeconds?: number } {
  const config = PRESETS[preset];
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket) {
    bucket = { tokens: config.capacity, lastRefill: now };
  } else {
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(
      config.capacity,
      bucket.tokens + elapsed * config.refillRate
    );
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    store.set(key, bucket);
    return { allowed: true };
  }

  const retryAfterSeconds = Math.ceil((1 - bucket.tokens) / config.refillRate);
  store.set(key, bucket);
  return { allowed: false, retryAfterSeconds };
}

// Clean up stale entries every 5 minutes to prevent memory growth.
// .unref() ensures this timer does not keep the process alive (important for test workers).
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [key, entry] of store.entries()) {
    if (entry.lastRefill < cutoff) store.delete(key);
  }
}, 5 * 60 * 1000).unref();
