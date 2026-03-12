import type { Session } from "./types";

const SESSION_KEY = "clinicflow-session";

export function getStoredSession() {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(SESSION_KEY);
  return value ? (JSON.parse(value) as Session) : null;
}

export function setStoredSession(session: Session | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
