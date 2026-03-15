import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/theme/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMe, updateMe } from '@/services/user';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMe()
      .then((info) => {
        setUsername(info.username);
        setEmail(info.email);
      })
      .catch((e: any) => Alert.alert('错误', e.message ?? '获取用户信息失败'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!username.trim() || !email.trim()) {
      Alert.alert('提示', '用户名和邮箱不能为空');
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
      Alert.alert('成功', '个人信息已更新', [
        { text: '确认', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('更新失败', e.message ?? '请稍后重试');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = [styles.input, { borderColor: colors.icon, color: colors.text }];

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.tint} />
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
          <ThemedText style={styles.fieldLabel}>用户名</ThemedText>
          <TextInput
            style={inputStyle}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ThemedText style={styles.fieldLabel}>邮箱</ThemedText>
          <TextInput
            style={inputStyle}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <ThemedText style={styles.fieldLabel}>新密码（不修改请留空）</ThemedText>
          <TextInput
            style={inputStyle}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="留空即不修改"
            placeholderTextColor={colors.icon}
          />

          <Pressable
            style={[styles.button, styles.editButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <ThemedText style={styles.buttonText}>保存修改</ThemedText>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
    opacity: 0.6,
    marginBottom: -6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  editButton: {
    backgroundColor: '#0a7ea4',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
