import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || null);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Add your login logic here
      console.log('Login:', email, password);
      setUser({ email, id: 1 });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email, password) => {
    setIsLoading(true);
    try {
      // Add your signup logic here
      console.log('Signup:', email, password);
      setUser({ email, id: 1 });
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Also clear staff admin session key if present
    try {
      localStorage.removeItem('staffAdminUser');
    } catch (e) {}
  };

  const setAuth = ({ accessToken: at, refreshToken: rt }, userInfo) => {
    setAccessToken(at);
    setRefreshToken(rt);
    if (userInfo) {
      // Normalize user object to include a stable `userId` property
      const normalized = {
        ...userInfo,
        userId: userInfo.userId || userInfo.id || userInfo.email || userInfo.username || null
      };
      setUser(normalized);
      try {
        localStorage.setItem('user', JSON.stringify(normalized));
      } catch (e) {}
    }
    try {
      if (at) localStorage.setItem('accessToken', at); else localStorage.removeItem('accessToken');
      if (rt) localStorage.setItem('refreshToken', rt); else localStorage.removeItem('refreshToken');
    } catch (e) {}
  };

  const updateUser = (newUser) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...(newUser || {}) };
      try {
        localStorage.setItem('user', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    accessToken,
    refreshToken,
    setAuth,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
