import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import { setUnauthorizedHandler, tokenStorage } from '../api/client';
import type { AuthUser, PermissionName } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  /** true mientras se verifica el token guardado al abrir la app. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: PermissionName) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Guarda el usuario logueado y sus permisos para toda la app.
 * Los permisos vienen del backend (login o /auth/me); el frontend solo los usa
 * para mostrar u ocultar cosas. La protección real está en el backend (403).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Si la API responde 401 (token vencido), se cierra la sesión.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Al abrir la app: si hay un token guardado, se pregunta al backend quién es.
  useEffect(() => {
    if (!tokenStorage.get()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user: current }) => setUser(current))
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    tokenStorage.set(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await authApi.register(name, email, password);
    tokenStorage.set(result.token);
    setUser(result.user);
  }, []);

  const hasPermission = useCallback(
    (permission: PermissionName) => user?.permissions.includes(permission) ?? false,
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout, hasPermission }),
    [user, loading, login, register, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
