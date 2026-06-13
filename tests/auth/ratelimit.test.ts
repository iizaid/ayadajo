import { describe, expect, it } from "vitest";
import { checkRateLimit, hashRateLimitKey, resetRateLimitForTests } from "@/lib/ratelimit";

describe("Milestone 4 login rate limiting abstraction", () => {
  it("hashes rate-limit keys instead of storing raw email values", () => {
    const key = hashRateLimitKey("login", "User@Example.com");

    expect(key).toMatch(/^login:[a-f0-9]{64}$/);
    expect(key).not.toContain("User@Example.com");
  });

  it("blocks attempts after the configured window budget is exhausted", () => {
    resetRateLimitForTests();

    const first = checkRateLimit("login:test", {
      maxAttempts: 2,
      windowMs: 60_000,
      now: new Date("2026-01-01T00:00:00Z"),
    });
    const second = checkRateLimit("login:test", {
      maxAttempts: 2,
      windowMs: 60_000,
      now: new Date("2026-01-01T00:00:01Z"),
    });
    const third = checkRateLimit("login:test", {
      maxAttempts: 2,
      windowMs: 60_000,
      now: new Date("2026-01-01T00:00:02Z"),
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });
});
