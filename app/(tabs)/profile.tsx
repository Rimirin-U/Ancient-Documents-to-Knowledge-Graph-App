import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMe, UserInfo } from '@/services/user';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    setLoadingInfo(true);
    try {
      const info = await getMe();
      setUserInfo(info);
    } catch (e: any) {
      Alert.alert('错误', e.message ?? '获取用户信息失败');
    } finally {
      setLoadingInfo(false);
    }
  }

  function handleLogout() {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定退出',
        style: 'destructive',
        onPress: async () => { await logout(); },
      },
    ]);
  }

  if (loadingInfo) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <ThemedText style={styles.headerTitle}>个人信息</ThemedText>
      </ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        {userInfo && (
          <View style={styles.card}>
            <InfoRow label="用户名" value={userInfo.username} colors={colors} />
            <InfoRow label="邮箱" value={userInfo.email} colors={colors} />
            <InfoRow
              label="注册时间"
              value={new Date(userInfo.created_at).toLocaleDateString('zh-CN')}
              colors={colors}
            />
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.editButton]}
            onPress={() => router.push('/edit-profile' as any)}
          >
            <ThemedText style={styles.buttonText}>修改个人信息</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <ThemedText style={styles.buttonText}>退出登录</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.infoRow}>
      <ThemedText style={[styles.infoLabel, { color: colors.icon }]}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 24,
    alignItems: 'left',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    flex: 2,
    textAlign: 'right',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#0a7ea4',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  logoutButton: {
    backgroundColor: '#e05252',
    marginTop: 8,
  },
});

