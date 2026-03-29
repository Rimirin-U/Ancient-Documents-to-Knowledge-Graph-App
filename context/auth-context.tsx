// context/auth-context.tsx
// 认证上下文，提供登录状态和相关操作
import { getMe } from '@/services/user';
import * as AuthService from '@/services/auth';
import { Image as ExpoImage } from 'expo-image';
import React, { createContext, useContext, useEffect, useState } from 'react';

// 认证状态和操作类型定义
type AuthState = {
  isLoggedIn: boolean;
  isLoading: boolean;
  /** 当前登录用户 ID，用于图片 URL 缓存隔离（见 getThumbnailUrl / getImageDataUrl） */
  userId: number | null;
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
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const valid = await AuthService.isTokenValid();
      if (valid) {
        try {
          const me = await getMe();
          setUserId(me.id);
        } catch {
          setUserId(null);
        }
      } else {
        setUserId(null);
      }
      setIsLoggedIn(valid);
      setIsLoading(false);
    })();
  }, []);

  async function login(username: string, password: string) {
    const res = await AuthService.login(username, password);
    setUserId(res.userId);
    setIsLoggedIn(true);
  }

  async function register(username: string, password: string, email: string) {
    await AuthService.register(username, password, email);
  }

  async function logout() {
    await AuthService.logout();
    setUserId(null);
    setIsLoggedIn(false);
    try {
      await Promise.all([ExpoImage.clearDiskCache(), ExpoImage.clearMemoryCache()]);
    } catch {
      // Web 等平台可能无磁盘缓存实现
    }
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, userId, login, register, logout }}>
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
