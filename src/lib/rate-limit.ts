const attempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

export function checkRateLimit(key: string): { limited: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_ATTEMPTS) {
      return {
        limited: true,
        retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
      };
    }
    entry.count++;
  } else {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }

  return { limited: false };
}

export function clearRateLimit(key: string) {
  attempts.delete(key);
}
