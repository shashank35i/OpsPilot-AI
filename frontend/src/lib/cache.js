function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCache(key) {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed.value ?? null;
  } catch {
    return null;
  }
}

export function writeCache(key, value, ttlMs) {
  if (!canUseStorage()) return;
  try {
    const payload = { value, expiresAt: Date.now() + ttlMs };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore cache write failures
  }
}
