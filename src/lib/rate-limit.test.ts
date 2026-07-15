import { describe, expect, it } from "vitest";
import { isRateLimited, recordFailedAttempt } from "./rate-limit";

describe("rate limiter", () => {
  it("does not rate-limit a key with no recorded failures", () => {
    const key = `test-${crypto.randomUUID()}`;
    expect(isRateLimited(key, 5)).toBe(false);
  });

  it("rate-limits once the failure count reaches the limit", () => {
    const key = `test-${crypto.randomUUID()}`;
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(key, 5)).toBe(false);
      recordFailedAttempt(key, 60_000);
    }
    expect(isRateLimited(key, 5)).toBe(true);
  });

  it("tracks independent keys separately", () => {
    const keyA = `test-${crypto.randomUUID()}`;
    const keyB = `test-${crypto.randomUUID()}`;
    for (let i = 0; i < 5; i++) recordFailedAttempt(keyA, 60_000);
    expect(isRateLimited(keyA, 5)).toBe(true);
    expect(isRateLimited(keyB, 5)).toBe(false);
  });

  it("resets after the window elapses", async () => {
    const key = `test-${crypto.randomUUID()}`;
    recordFailedAttempt(key, 5);
    expect(isRateLimited(key, 1)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(isRateLimited(key, 1)).toBe(false);
  });

  it("never blocks a key that only ever succeeds (no failures recorded)", () => {
    const key = `test-${crypto.randomUUID()}`;
    for (let i = 0; i < 20; i++) {
      expect(isRateLimited(key, 5)).toBe(false);
      // success path: no recordFailedAttempt call
    }
  });
});
