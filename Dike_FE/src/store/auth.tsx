import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getToken, clearTokens } from '../api/client';
import { getMe, login as apiLogin, logout as apiLogout } from '../api';
import type { ApiUser } from '../types';

interface AuthCtx {
  user: ApiUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (id: string, pw: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    getMe()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const login = async (id: string, pw: string) => {
    await apiLogin(id, pw);
    const me = await getMe();
    setUser(me);
  };

  const logout = () => {
    const refresh = localStorage.getItem('refresh_token') ?? '';
    apiLogout(refresh);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, isLoggedIn: !!user, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
