// Minimal in-process fixed-window rate limiter. Sufficient for a single
// small-business deployment (single Node process, low hundreds of users);
// state is intentionally not shared across processes/restarts.
//
// Only failures should ever call recordFailedAttempt — successful attempts
// must never touch the counter, otherwise legitimate concurrent use (the
// same account signing in from two devices, or several test workers hitting
// the same seeded account) can trip the limiter even though nothing wrong
// happened.
const attempts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number): boolean {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= Date.now()) return false;
  return entry.count >= limit;
}

export function recordFailedAttempt(key: string, windowMs: number) {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  entry.count += 1;
}
