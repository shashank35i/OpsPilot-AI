export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function getToken() {
  return localStorage.getItem("token") || "";
}

function normalizeErrorMessage(data: any): string {
  const fallback = "Request failed";
  const raw = data?.message ?? data?.error ?? fallback;
  if (typeof raw !== "string") return fallback;

  // Some backend validators return JSON-serialized issue arrays as a string.
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const first = Array.isArray(parsed) ? parsed[0] : parsed;
      if (first?.message) {
        const path = Array.isArray(first?.path) ? first.path.join(".") : "";
        if (path) return `${path}: ${first.message}`;
        return first.message;
      }
    } catch {
      // Keep original string if parsing fails.
    }
  }

  return raw || fallback;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(normalizeErrorMessage(data));
  return data as T;
}
