import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, TOKEN_KEY, USER_KEY } from '../services/api';

const AuthContext = createContext(null);

export const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  USER: '/user/stores',
  OWNER: '/owner/dashboard',
};

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

/**
 * Holds the session (JWT + user). The token lives in localStorage so a refresh
 * keeps the user signed in; on start-up it is re-validated with /auth/me, so a
 * tampered or expired token (or a changed role) never survives.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => (localStorage.getItem(TOKEN_KEY) ? readStoredUser() : null));
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const saveSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  // Validate a stored token once on load.
  useEffect(() => {
    let cancelled = false;
    if (!localStorage.getItem(TOKEN_KEY)) return undefined;
    authApi
      .me()
      .then(({ user: fresh }) => {
        if (cancelled) return;
        localStorage.setItem(USER_KEY, JSON.stringify(fresh));
        setUser(fresh);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  // Any 401 from the API (expired/invalid token) ends the session.
  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [logout]);

  // Keep multiple tabs in sync (logout in one tab logs out the others).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY && !e.newValue) {
        setToken(null);
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const result = await authApi.login({ email, password });
      saveSession(result.token, result.user);
      return result.user;
    },
    [saveSession]
  );

  const register = useCallback(
    async (form) => {
      const result = await authApi.register(form);
      saveSession(result.token, result.user);
      return result.user;
    },
    [saveSession]
  );

  const changePassword = useCallback(
    async (form) => {
      const result = await authApi.changePassword(form);
      saveSession(result.token, result.user);
      return result.user;
    },
    [saveSession]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      checking,
      login,
      register,
      logout,
      changePassword,
      homePath: user ? ROLE_HOME[user.role] : '/login',
    }),
    [token, user, checking, login, register, logout, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
