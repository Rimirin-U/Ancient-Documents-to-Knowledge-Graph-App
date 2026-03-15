// app/register.tsx
// 注册页
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/theme/colors';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { register } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.warning('提示', '请填写所有必填项');
      return;
    }
    if (password !== confirmPassword) {
      toast.warning('提示', '两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), password, email.trim());
      setSuccessDialogVisible(true);
    } catch (e: any) {
      toast.error('注册失败', e.message ?? '请稍后重试');
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

        <Button
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={handleRegister}
          disabled={loading}
          loading={loading}
        >
          注册
        </Button>

        <Button variant="link" onPress={() => router.back()} style={styles.link}>
          已有账号？去登录
        </Button>
      </KeyboardAvoidingView>

      <AlertDialog
        isVisible={successDialogVisible}
        onClose={() => setSuccessDialogVisible(false)}
        title="注册成功"
        description="请登录"
        confirmText="确认"
        cancelText="取消"
        showCancelButton={false}
        onConfirm={() => {
          setSuccessDialogVisible(false);
          router.replace('/login' as any);
        }}
      />
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
    marginTop: 4,
  },
  link: {
    marginTop: 4,
  },
});
