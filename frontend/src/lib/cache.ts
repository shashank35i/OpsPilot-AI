type CacheEnvelope<T> = {
  value: T;
  expiresAt: number;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCache<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed.value ?? null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T, ttlMs: number) {
  if (!canUseStorage()) return;
  try {
    const payload: CacheEnvelope<T> = { value, expiresAt: Date.now() + ttlMs };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore cache write failures
  }
}

