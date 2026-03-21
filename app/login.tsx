// app/login.tsx
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/theme/colors';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      toast.warning('提示', '请填写用户名和密码');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e: any) {
      toast.error('登录失败', e.message ?? '请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  const inputSurface = { backgroundColor: colors.card, borderColor: colors.border };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inner, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={[styles.brand, { backgroundColor: colors.secondary }]}>
          <MaterialIcons name="menu-book" size={40} color={colors.primary} />
        </View>
        <ThemedText type="title" style={styles.title}>
          欢迎回来
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
          登录后可上传文书、查看识别结果与智能问答
        </ThemedText>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, inputSurface, { color: colors.text }]}
            placeholder="用户名"
            placeholderTextColor={colors.mutedForeground}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, inputSurface, { color: colors.text }]}
            placeholder="密码"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button style={styles.button} onPress={handleLogin} disabled={loading} loading={loading}>
            登录
          </Button>

          <Button variant="link" onPress={() => router.push('/register' as any)} style={styles.link}>
            没有账号？去注册
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  brand: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  form: {
    gap: 14,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    marginTop: 6,
  },
  link: {
    marginTop: 4,
  },
});
