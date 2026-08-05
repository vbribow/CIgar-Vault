const FOUNDER_SESSION_KEY = "hojavia-founder-session-key";

export function readFounderSessionKey() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(FOUNDER_SESSION_KEY)?.trim() || "";
}

export function rememberFounderSessionKey(value: string) {
  const key = value.trim();
  if (typeof window === "undefined" || !key) return;
  window.sessionStorage.setItem(FOUNDER_SESSION_KEY, key);
}

export function forgetFounderSessionKey() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(FOUNDER_SESSION_KEY);
}
