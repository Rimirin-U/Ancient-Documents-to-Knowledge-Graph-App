import { AuthProvider, useAuth } from '@/context/auth-context';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/theme/theme-provider';
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export const unstable_settings = {
  anchor: '(tabs)',
};

// 路由守卫组件
// 根据认证状态控制访问权限
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';
    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/login' as any);
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [isLoggedIn, isLoading, segments]);

  // 停止渲染其他页面
  if (isLoading) return null;

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <RouteGuard>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="image-detail" options={{ headerShown: true, title: '图片详情' }} />
                <Stack.Screen name="cross-doc-detail" options={{ headerShown: true, title: '跨文档详情' }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="register" options={{ headerShown: true, title: '注册' }} />
                <Stack.Screen name="edit-profile" options={{ headerShown: true, title: '修改个人信息' }} />
              </Stack>
            </RouteGuard>
            <StatusBar style="auto" />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
