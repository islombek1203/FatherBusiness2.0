import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-${crypto.randomUUID()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, { limit: 5, windowMs: 60_000 }).allowed).toBe(true);
    }
  });

  it("blocks requests once the limit is exceeded within the window", () => {
    const key = `test-${crypto.randomUUID()}`;
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, { limit: 5, windowMs: 60_000 });
    }
    const result = checkRateLimit(key, { limit: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const key = `test-${crypto.randomUUID()}`;
    checkRateLimit(key, { limit: 1, windowMs: 1 });
    expect(checkRateLimit(key, { limit: 1, windowMs: 1 }).allowed).toBe(false);
  });

  it("tracks independent keys separately", () => {
    const keyA = `test-${crypto.randomUUID()}`;
    const keyB = `test-${crypto.randomUUID()}`;
    checkRateLimit(keyA, { limit: 1, windowMs: 60_000 });
    expect(checkRateLimit(keyB, { limit: 1, windowMs: 60_000 }).allowed).toBe(true);
  });
});
