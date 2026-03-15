// app/register.tsx
// 注册页
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

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { register } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('提示', '请填写所有必填项');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), password, email.trim());
      Alert.alert('注册成功', '请登录', [
        { text: '确认', onPress: () => router.replace('/login' as any) },
      ]);
    } catch (e: any) {
      Alert.alert('注册失败', e.message ?? '请稍后重试');
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
        <ThemedText type="title" style={styles.title}>注册</ThemedText>

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
          placeholder="邮箱"
          placeholderTextColor={colors.icon}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
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

        <TextInput
          style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
          placeholder="确认密码"
          placeholderTextColor={colors.icon}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Pressable
          style={[styles.button, { backgroundColor: colors.tint }, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>注册</ThemedText>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.link}>
          <ThemedText type="link">已有账号？去登录</ThemedText>
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
