import { useEffect, useState } from "react";

const SESSION_KEY = "ap-physics-local-session-v1";
const SESSION_EVENT = "ap-physics-session-change";

type LocalUser = {
  id: string;
  name: string;
  isLocal: true;
};

function readSession(): LocalUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalUser;
    return parsed?.id && parsed.isLocal ? parsed : null;
  } catch {
    return null;
  }
}

function notifySessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(() => readSession());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const sync = () => setUser(readSession());
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    const existing = readSession();
    const next: LocalUser = existing ?? {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: "Local learner",
      isLocal: true,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setUser(next);
    notifySessionChange();
    setIsLoading(false);
    return next;
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    notifySessionChange();
  };

  return {
    isLoading,
    isAuthenticated: user !== null,
    user,
    signIn,
    signOut,
  };
}
