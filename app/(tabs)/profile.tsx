import { AlertDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/theme/colors';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMe, UserInfo } from '@/services/user';
import { useRouter, useNavigation } from 'expo-router';
import { useEffect, useState, useLayoutEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  Pressable,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const toast = useToast();
  const textColor = colors.text;

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser(isRefresh?: boolean) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingInfo(true);
    }
    try {
      const info = await getMe();
      setUserInfo(info);
    } catch (e: any) {
      toast.error('错误', e.message ?? '获取用户信息失败');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoadingInfo(false);
      }
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => fetchUser(true)}
          hitSlop={10}
          style={styles.headerButton}
        >
          <MaterialIcons name="refresh" size={24} color={textColor} />
        </Pressable>
      ),
    });
  }, [textColor, navigation]);

  function handleLogout() {
    setLogoutDialogVisible(true);
  }

  if (loadingInfo) {
    return (
      <ThemedView style={styles.centered}>
        <Skeleton width="88%" height={120} />
        <Skeleton width="88%" height={46} />
        <Skeleton width="88%" height={46} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchUser(true)}
            tintColor={textColor}
          />
        }
      >
        {userInfo && (
          <Card style={[styles.card, { borderColor: colors.border }]}>
            <InfoRow label="用户名" value={userInfo.username} colors={colors} />
            <InfoRow label="邮箱" value={userInfo.email} colors={colors} />
            <InfoRow
              label="注册时间"
              value={new Date(userInfo.created_at).toLocaleDateString('zh-CN')}
              colors={colors}
            />
          </Card>
        )}

        <View style={styles.actions}>
          <Button
            style={styles.button}
            onPress={() => router.push('/edit-profile' as any)}
            variant="outline"
          >
            修改个人信息
          </Button>

          <Button style={styles.button} onPress={handleLogout} variant="destructive">
            退出登录
          </Button>
        </View>
      </ScrollView>

      <AlertDialog
        isVisible={logoutDialogVisible}
        onClose={() => setLogoutDialogVisible(false)}
        title="退出登录"
        description="确定要退出登录吗？"
        confirmText="确定退出"
        cancelText="取消"
        onCancel={() => setLogoutDialogVisible(false)}
        onConfirm={async () => {
          setLogoutDialogVisible(false);
          await logout();
        }}
      />
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
  headerButton: {
    padding: 6,
    marginRight: 6,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
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
    width: '100%',
  },
});

