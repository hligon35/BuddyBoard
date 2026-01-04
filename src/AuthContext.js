import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Api from './Api';
import { setDebugContext, logger } from './utils/logger';
import { resetToLogin } from './navigationRef';

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

  async function setAuth({ token: nextToken, user: nextUser }) {
    if (!nextToken) throw new Error('Missing token');
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    if (nextUser) await AsyncStorage.setItem('auth_user', JSON.stringify(nextUser));
    setToken(nextToken);
    Api.setAuthToken(nextToken);
    if (nextUser) setUser(nextUser);
  }

  async function login(email, password) {
    const res = await Api.login(email, password);
    if (!res || !res.token) throw new Error('Invalid login response');
    await setAuth({ token: res.token, user: res.user });
    return res;
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    Api.setAuthToken(null);
    resetToLogin();
  }
  const value = { token, user, loading, login, logout };
  value.setAuth = setAuth;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
