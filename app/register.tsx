// app/register.tsx
import { AlertDialog } from '@/components/ui/alert-dialog';
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
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { register } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();

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

  const inputSurface = { backgroundColor: colors.card, borderColor: colors.border };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: Math.max(insets.top, 16), paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.brand, { backgroundColor: colors.secondary }]}>
            <MaterialIcons name="person-add" size={36} color={colors.primary} />
          </View>
          <ThemedText type="title" style={styles.title}>
            创建账号
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
            注册后即可同步文书与识别记录
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
              placeholder="邮箱"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
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

            <TextInput
              style={[styles.input, inputSurface, { color: colors.text }]}
              placeholder="确认密码"
              placeholderTextColor={colors.mutedForeground}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Button style={styles.button} onPress={handleRegister} disabled={loading} loading={loading}>
              注册
            </Button>

            <Button variant="link" onPress={() => router.back()} style={styles.link}>
              已有账号？去登录
            </Button>
          </View>
        </ScrollView>
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
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 28,
    gap: 12,
  },
  brand: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  form: {
    gap: 12,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
  },
  link: {
    marginTop: 4,
  },
});
