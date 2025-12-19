import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Api from './Api';
import { setDebugContext, logger } from './utils/logger';
import { DISABLE_DEV_AUTOLOGIN } from './config';

const TOKEN_KEY = 'auth_token';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // If the API returns 401, clear auth so the app can re-login cleanly.
  useEffect(() => {
    Api.setUnauthorizedHandler(() => {
      try {
        logger.warn('auth', 'Received 401 from API; clearing auth');
      } catch (e) {
        // ignore
      }
      // Fire and forget; we don't want to block the interceptor chain.
      logout().catch(() => {});
    });
    return () => Api.setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await AsyncStorage.getItem(TOKEN_KEY);
        const u = await AsyncStorage.getItem('auth_user');
        if (t && mounted) {
          setToken(t);
          Api.setAuthToken(t);
        }
        if (u && mounted) setUser(JSON.parse(u));
      } catch (e) {
        console.warn('Auth load failed', e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    try {
      setDebugContext({
        userId: user?.id,
        role: user?.role,
        hasToken: !!token,
      });
    } catch (e) {
      // ignore
    }
  }, [user, token]);

  // Dev auto-login for local testing (non-persistent)
  useEffect(() => {
    if (__DEV__ && !DISABLE_DEV_AUTOLOGIN && !loading && !token) {
      const devToken = 'dev-token';
      setToken(devToken);
      Api.setAuthToken(devToken);
      setUser({ id: 'dev', name: 'Developer', email: 'dev@example.com', role: 'ADMIN' });
      logger.info('auth', 'Dev auto-login enabled');
    }
  }, [loading]);

  async function login(email, password) {
    const res = await Api.login(email, password);
    if (!res || !res.token) throw new Error('Invalid login response');
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    if (res.user) await AsyncStorage.setItem('auth_user', JSON.stringify(res.user));
    setToken(res.token);
    Api.setAuthToken(res.token);
    if (res.user) setUser(res.user);
    return res;
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    Api.setAuthToken(null);
  }

  // Dev helper: set role/user for testing and persist to AsyncStorage
  async function setRole(role) {
    if (!role) return;
    const next = Object.assign({}, user || { id: 'dev', name: 'Developer', email: 'dev@example.com' }, { role });
    try {
      await AsyncStorage.setItem('auth_user', JSON.stringify(next));
    } catch (e) {
      // ignore
    }
    setUser(next);
  }

  // Dev helper to programmatically set auth (only exposed in dev builds)
  async function devSetAuth({ token: t, user: u }) {
    if (!__DEV__) return;
    try {
      if (t) {
        await AsyncStorage.setItem(TOKEN_KEY, t);
        setToken(t);
        Api.setAuthToken(t);
      }
      if (u) {
        await AsyncStorage.setItem('auth_user', JSON.stringify(u));
        setUser(u);
      }
    } catch (e) {
      console.warn('devSetAuth failed', e);
    }
  }

  const value = { token, user, loading, login, logout, setRole };
  if (__DEV__) value.devSetAuth = devSetAuth;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
