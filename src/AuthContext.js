import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Api from './Api';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'authToken';

export function AuthProvider({ children }){
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try{
        const t = await AsyncStorage.getItem(TOKEN_KEY);
        if (t && mounted){
          setToken(t);
          Api.setAuthToken(t);
        }
      }catch(e){ console.warn('Auth load failed', e.message); }
      finally{ if (mounted) setLoading(false); }
    })();
    return () => { mounted = false };
  }, []);

  async function login(email, password){
    const res = await Api.login(email, password);
    // Expect backend to return { token, user }
    if (!res || !res.token) throw new Error('Invalid login response');
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    Api.setAuthToken(res.token);
    if (res.user) setUser(res.user);
    return res;
  }

  async function logout(){
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    Api.setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
