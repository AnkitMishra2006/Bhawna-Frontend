import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  AUTH_BACKEND_URL,
  TOKEN_STORAGE_KEY,
  type User,
  type AuthResult,
} from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  loginWithGoogle: () => void;
  loginWithEmail: (email: string, password: string) => Promise<AuthResult>;
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<AuthResult>;
  logout: () => void;
  getToken: () => string | null;
  setSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    /* ignore */
  }
  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${AUTH_BACKEND_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (!res.ok) throw new Error("invalid");
        const data: User = await res.json();
        if (!cancelled) {
          setUser(data);
          setToken(stored);
        }
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = `${AUTH_BACKEND_URL}/auth/google`;
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const res = await fetch(`${AUTH_BACKEND_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const error = await parseError(res);
          return { success: false, error };
        }
        const data: { token: string; user: User } = await res.json();
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } catch {
        return {
          success: false,
          error: `Could not reach the auth server at ${AUTH_BACKEND_URL}.`,
        };
      }
    },
    [],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
    ): Promise<AuthResult> => {
      try {
        const res = await fetch(`${AUTH_BACKEND_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) {
          const error = await parseError(res);
          return { success: false, error };
        }
        const data: { token: string; user: User } = await res.json();
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } catch {
        return {
          success: false,
          error: `Could not reach the auth server at ${AUTH_BACKEND_URL}.`,
        };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const getToken = useCallback(() => token, [token]);

  const setSession = useCallback((t: string, u: User) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, t);
    setToken(t);
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login: loginWithGoogle,
        loginWithGoogle,
        loginWithEmail,
        register,
        logout,
        getToken,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
