/**
 * Simple in-memory rate limiter for API routes.
 * Tracks attempts by a string key (e.g. IP address or email).
 * Automatically clears expired windows.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(
    key: string,
    { max = 10, windowMs = 15 * 60 * 1000 }: { max?: number; windowMs?: number } = {}
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        // First attempt or window expired — start fresh
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
    }

    entry.count += 1;

    if (entry.count > max) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

export function resetRateLimit(key: string) {
    store.delete(key);
}
