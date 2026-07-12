import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const { data } = await authApi.login(email, password);
    const payload = data.data;
    localStorage.setItem('accessToken', payload.accessToken);
    localStorage.setItem('refreshToken', payload.refreshToken);
    setUser(payload.user);
    setRoles(payload.roles);
    setPermissions(payload.permissions);
    return payload;
  };

  const signup = async (signupData) => {
    const { data } = await authApi.signup(signupData);
    const payload = data.data;
    localStorage.setItem('accessToken', payload.accessToken);
    localStorage.setItem('refreshToken', payload.refreshToken);
    setUser(payload.user);
    setRoles(payload.roles);
    setPermissions(payload.permissions);
    return payload;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      localStorage.clear();
      setUser(null);
      setRoles([]);
      setPermissions([]);
    }
  };

  const hasPermission = (perm) => permissions.includes(perm);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then(({ data }) => {
        setUser(data.data.user);
        setRoles(data.data.roles);
        setPermissions(data.data.permissions);
      })
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({ user, roles, permissions, loading, login, signup, logout, hasPermission }),
    [user, roles, permissions, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
