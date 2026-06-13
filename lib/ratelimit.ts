import { createHash } from "node:crypto";

export type RateLimitDecision =
  | { allowed: true; remaining: number; resetAt: Date }
  | { allowed: false; remaining: 0; resetAt: Date };

export type RateLimitOptions = {
  windowMs: number;
  maxAttempts: number;
  now?: Date;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function hashRateLimitKey(scope: string, value: string): string {
  return `${scope}:${createHash("sha256").update(value.trim().toLowerCase()).digest("hex")}`;
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitDecision {
  const now = options.now?.getTime() ?? Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: Math.max(options.maxAttempts - 1, 0),
      resetAt: new Date(resetAt),
    };
  }

  if (current.count >= options.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(current.resetAt),
    };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(options.maxAttempts - current.count, 0),
    resetAt: new Date(current.resetAt),
  };
}

export function resetRateLimitForTests(): void {
  buckets.clear();
}
