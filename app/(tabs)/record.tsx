import { FloatingViewSwitch } from '@/components/record/floating-view-switch';
import { RecordCard } from '@/components/record/record-card';
import { SelectionActions } from '@/components/record/selection-actions';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  getImageRecordList,
  getImageSourceHeaders,
  RecordImageItem,
  triggerImageAnalysis,
} from '@/services/record';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecordScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const pageBg = useThemeColor({ light: '#eceef1', dark: '#121418' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const subtleColor = useThemeColor({ light: '#616976', dark: '#a1a9b5' }, 'icon');
  const menuBg = useThemeColor({ light: '#f4f5f7', dark: '#21262e' }, 'background');
  const menuBorder = useThemeColor({ light: '#d7dae0', dark: '#3a414c' }, 'icon');

  const [records, setRecords] = useState<RecordImageItem[]>([]);
  const [imageHeaders, setImageHeaders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [viewSwitchOpen, setViewSwitchOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'image' | 'cross-doc'>('image');

  const selectedCount = selectedIds.length;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const fetchRecords = useCallback(async (isRefresh?: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage('');

    try {
      const [list, headers] = await Promise.all([
        getImageRecordList({ limit: 50 }),
        getImageSourceHeaders(),
      ]);
      setRecords(list);
      setImageHeaders(headers);
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载记录失败';
      setErrorMessage(message);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '记录',
      headerRight:
        currentView === 'image'
          ? () => (
              <Pressable
                onPress={() => setHeaderMenuVisible(true)}
                hitSlop={10}
                style={styles.headerMenuButton}
              >
                <MaterialIcons name="menu" size={26} color={textColor} />
              </Pressable>
            )
          : undefined,
    });
  }, [navigation, textColor, currentView]);

  function setSelectModeWithReset(next: boolean) {
    setSelectMode(next);
    setHeaderMenuVisible(false);
    if (next) {
      setViewSwitchOpen(false);
    }
    if (!next) {
      setSelectedIds([]);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      }
      return [...prev, id];
    });
  }

  async function handleBatchAnalyze() {
    if (!selectedCount) return;
    setBatchLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => triggerImageAnalysis(id))
      );
      const successCount = results.filter((item) => item.status === 'fulfilled').length;
      const failCount = results.length - successCount;
      Alert.alert('分析任务', `已提交 ${successCount} 项${failCount ? `，失败 ${failCount} 项` : ''}`);
      if (successCount) {
        setSelectModeWithReset(false);
      }
    } finally {
      setBatchLoading(false);
    }
  }

  function handleBatchDelete() {
    if (!selectedCount) return;
    Alert.alert('删除提示', '删除操作暂为本地移除，确定继续吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          setRecords((prev) => prev.filter((item) => !selectedSet.has(item.id)));
          setSelectModeWithReset(false);
        },
      },
    ]);
  }

  function handleViewSelect(view: 'image' | 'cross-doc') {
    setViewSwitchOpen(false);
    setCurrentView(view);
    if (view === 'cross-doc') {
      setSelectModeWithReset(false);
      setHeaderMenuVisible(false);
    }
  }

  function renderList() {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={textColor} />
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          <Pressable style={styles.retryButton} onPress={() => fetchRecords()}>
            <ThemedText style={styles.retryButtonText}>重试</ThemedText>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <RecordCard
            item={item}
            selectable={selectMode}
            selected={selectedSet.has(item.id)}
            imageHeaders={imageHeaders}
            onToggleSelect={toggleSelect}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <ThemedText style={{ color: subtleColor }}>暂无记录</ThemedText>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRecords(true)}
            tintColor={textColor}
          />
        }
      />
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBg }]}>
      {currentView === 'image' ? renderList() : <CrossDocPlaceholder subtleColor={subtleColor} />}

      {!selectMode ? (
        <FloatingViewSwitch
          currentView={currentView}
          open={viewSwitchOpen}
          onToggleOpen={() => setViewSwitchOpen((prev) => !prev)}
          onSelectView={handleViewSelect}
        />
      ) : null}

      {selectMode ? (
        <SelectionActions
          onCancel={() => setSelectModeWithReset(false)}
          onAnalyze={handleBatchAnalyze}
          onDelete={handleBatchDelete}
          disabled={!selectedCount || batchLoading}
        />
      ) : null}

      <Modal
        visible={headerMenuVisible && currentView === 'image'}
        transparent
        animationType="fade"
        onRequestClose={() => setHeaderMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setHeaderMenuVisible(false)}
        >
          <View
            style={[
              styles.headerMenuPanel,
              { backgroundColor: menuBg, borderColor: menuBorder },
              { top: insets.top + 6 },
            ]}
          >
            <Pressable
              style={styles.headerMenuItem}
              onPress={() => setSelectModeWithReset(!selectMode)}
            >
              <ThemedText>
                {selectMode ? '退出多选' : '多选'}
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerMenuButton: {
    paddingHorizontal: 6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  errorText: {
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 12,
  },
  emptyWrap: {
    marginTop: 36,
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
  },
  headerMenuPanel: {
    position: 'absolute',
    right: 8,
    borderRadius: 10,
    overflow: 'hidden',
    minWidth: 110,
    backgroundColor: '#f4f5f7',
    borderWidth: 1,
    borderColor: '#d7dae0',
  },
  headerMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
});

function CrossDocPlaceholder({ subtleColor }: { subtleColor: string }) {
  return (
    <View style={styles.centered}>
      <ThemedText style={{ color: subtleColor }}>跨文档</ThemedText>
    </View>
  );
}
