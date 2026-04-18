import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, LoginResponse } from '../services/api/authApi';
import { tokenStore } from '../services/api/tokenStore';

const TOKEN_KEY = '@student_companion:token';
const USER_ID_KEY = '@student_companion:userId';

interface AuthContextData {
  userId: string | null;
  token: string | null;
  user: LoginResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const [[, storedToken], [, storedUserId]] = await AsyncStorage.multiGet([
          TOKEN_KEY,
          USER_ID_KEY,
        ]);
        if (storedToken && storedUserId) {
          setToken(storedToken);
          setUserId(storedUserId);
          tokenStore.setToken(storedToken);
        }
      } catch {
        // ignora erros de storage na inicialização
      } finally {
        setIsLoading(false);
      }
    }

    tokenStore.setOnUnauthorized(performLogout);
    loadStoredAuth();
  }, []);

  async function performLogout() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_ID_KEY]);
    tokenStore.setToken(null);
    setToken(null);
    setUserId(null);
    setUser(null);
  }

  async function login(email: string, password: string) {
    const response = await authApi.login(email, password);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, response.token],
      [USER_ID_KEY, response.user.id],
    ]);
    tokenStore.setToken(response.token);
    setToken(response.token);
    setUserId(response.user.id);
    setUser(response.user);
  }

  const value = useMemo(
    () => ({
      userId,
      token,
      user,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout: performLogout,
    }),
    [userId, token, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
