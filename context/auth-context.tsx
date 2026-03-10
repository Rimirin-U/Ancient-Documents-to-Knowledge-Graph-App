// context/auth-context.tsx
// 认证上下文，提供登录状态和相关操作
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as AuthService from '@/services/auth';

// 认证状态和操作类型定义
type AuthState = {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

// 认证提供者组件
// 管理认证状态和操作
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AuthService.isTokenValid().then((valid) => {
      setIsLoggedIn(valid);
      setIsLoading(false);
    });
  }, []);

  async function login(username: string, password: string) {
    await AuthService.login(username, password);
    setIsLoggedIn(true);
  }

  async function register(username: string, password: string, email: string) {
    await AuthService.register(username, password, email);
  }

  async function logout() {
    await AuthService.logout();
    setIsLoggedIn(false);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 认证上下文钩子
// 方便组件访问认证状态和操作
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
