// app/login.tsx
// 登录页
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/theme/colors';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert('提示', '请填写用户名和密码');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e: any) {
      Alert.alert('登录失败', e.message ?? '请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <ThemedText type="title" style={styles.title}>登录</ThemedText>

        <TextInput
          style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
          placeholder="用户名"
          placeholderTextColor={colors.icon}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
          placeholder="密码"
          placeholderTextColor={colors.icon}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={[styles.button, { backgroundColor: colors.tint }, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>登录</ThemedText>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/register' as any)} style={styles.link}>
          <ThemedText type="link">注册</ThemedText>
        </Pressable>
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
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    alignItems: 'center',
    marginTop: 4,
  },
});
