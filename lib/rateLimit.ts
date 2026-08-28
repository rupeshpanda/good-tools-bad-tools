/**
 * Per-IP rate limiting for the live demo endpoint.
 *
 * In-memory and therefore per-instance: a serverless deployment running
 * several instances multiplies the effective allowance, and a cold start
 * resets it. That is a real limitation and it is fine here — the goal is to
 * stop a bored visitor holding down a button, not to defeat a determined
 * attacker. A shared store would be the answer if this ever needed to be
 * airtight.
 */

const WINDOW_MS = 60_000;
// Two requests per button press (one per variant), so this is 5 runs/min.
const MAX_REQUESTS = 10;

const hits = new Map<string, number[]>();

export function rateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
} {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    const oldest = Math.min(...recent);
    hits.set(ip, recent);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000)),
    };
  }

  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 5_000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - recent.length,
    retryAfterSec: 0,
  };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
