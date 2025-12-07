import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Api from './Api';

const TOKEN_KEY = 'auth_token';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Dev auto-login for local testing (non-persistent)
  useEffect(() => {
    if (__DEV__ && !loading && !token) {
      const devToken = 'dev-token';
      setToken(devToken);
      Api.setAuthToken(devToken);
      setUser({ id: 'dev', name: 'Developer', email: 'dev@example.com', role: 'ADMIN' });
      console.log('AuthContext: dev auto-login enabled');
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

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
