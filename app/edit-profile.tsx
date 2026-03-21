import { AlertDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/theme/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMe, updateMe } from '@/services/user';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedDialogVisible, setSavedDialogVisible] = useState(false);

  useEffect(() => {
    getMe()
      .then((info) => {
        setUsername(info.username);
        setEmail(info.email);
      })
      .catch((e: any) => toast.error('错误', e.message ?? '获取用户信息失败'))
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleSave() {
    if (!username.trim() || !email.trim()) {
      toast.warning('提示', '用户名和邮箱不能为空');
      return;
    }
    setSaving(true);
    try {
      const params: { username?: string; email?: string; password?: string } = {
        username: username.trim(),
        email: email.trim(),
      };
      if (password.trim()) {
        params.password = password.trim();
      }
      await updateMe(params);
      setSavedDialogVisible(true);
    } catch (e: any) {
      toast.error('更新失败', e.message ?? '请稍后重试');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
  ];

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <Skeleton width="85%" height={44} />
        <Skeleton width="85%" height={44} />
        <Skeleton width="85%" height={44} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>用户名</ThemedText>
          <TextInput
            style={inputStyle}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={colors.mutedForeground}
          />

          <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>邮箱</ThemedText>
          <TextInput
            style={inputStyle}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            placeholderTextColor={colors.mutedForeground}
          />

          <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            新密码（不修改请留空）
          </ThemedText>
          <TextInput
            style={inputStyle}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="留空即不修改"
            placeholderTextColor={colors.mutedForeground}
          />

          <Button style={styles.button} onPress={handleSave} disabled={saving} loading={saving}>
            保存修改
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertDialog
        isVisible={savedDialogVisible}
        onClose={() => setSavedDialogVisible(false)}
        title="成功"
        description="个人信息已更新"
        confirmText="确认"
        showCancelButton={false}
        onConfirm={() => {
          setSavedDialogVisible(false);
          router.back();
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: {
    padding: 24,
    gap: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: -6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    marginTop: 12,
  },
});
