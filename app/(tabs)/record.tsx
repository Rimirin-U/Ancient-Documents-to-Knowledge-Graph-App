import { CrossDocCard } from '@/components/record/cross-doc-card';
import { FloatingViewSwitch } from '@/components/record/floating-view-switch';
import { RecordCard } from '@/components/record/record-card';
import { SelectionActions } from '@/components/record/selection-actions';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColor } from '@/hooks/useColor';
import {
  createCrossDocTaskFromImages,
  CrossDocRecordItem,
  deleteCrossDocTask,
  deleteImageRecord,
  getCrossDocRecordList,
  getImageRecordList,
  RecordImageItem,
} from '@/services/record';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MENU_FADE_DURATION = 100;

export default function RecordScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const pageBg = useColor('screen');
  const textColor = useColor('text', {});
  const subtleColor = useColor('icon', { light: '#616976', dark: '#a1a9b5' });
  const menuBg = useColor('background', { light: '#f4f5f7', dark: '#21262e' });
  const menuBorder = useColor('icon', { light: '#d7dae0', dark: '#3a414c' });

  const [records, setRecords] = useState<RecordImageItem[]>([]);
  const [crossDocRecords, setCrossDocRecords] = useState<CrossDocRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [viewSwitchOpen, setViewSwitchOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [currentView, setCurrentView] = useState<'image' | 'cross-doc'>('image');
  const menuOpacity = useRef(new Animated.Value(0)).current;

  const selectedCount = selectedIds.length;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const fetchImageRecords = useCallback(async (isRefresh?: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage('');

    try {
      const list = await getImageRecordList({ limit: 50 });
      setRecords(list);
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

  const fetchCrossDocRecords = useCallback(async (isRefresh?: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage('');

    try {
      const list = await getCrossDocRecordList({ limit: 50 });
      setCrossDocRecords(list);
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载跨文档记录失败';
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
    if (currentView === 'image') {
      fetchImageRecords();
      return;
    }
    fetchCrossDocRecords();
  }, [currentView, fetchImageRecords, fetchCrossDocRecords]);

  const openHeaderMenu = useCallback(() => {
    if (headerMenuVisible) return;
    setHeaderMenuVisible(true);
    menuOpacity.setValue(0);
    Animated.timing(menuOpacity, {
      toValue: 1,
      duration: MENU_FADE_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [headerMenuVisible, menuOpacity]);

  const closeHeaderMenu = useCallback(() => {
    Animated.timing(menuOpacity, {
      toValue: 0,
      duration: MENU_FADE_DURATION,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setHeaderMenuVisible(false);
      }
    });
  }, [menuOpacity]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '记录',
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <Pressable
            onPress={() => {
              if (currentView === 'image') {
                fetchImageRecords(true);
              } else {
                fetchCrossDocRecords(true);
              }
            }}
            hitSlop={10}
            style={styles.headerButton}
          >
            <MaterialIcons name="refresh" size={24} color={textColor} />
          </Pressable>
          <Pressable onPress={openHeaderMenu} hitSlop={10} style={styles.headerButton}>
            <MaterialIcons name="menu" size={26} color={textColor} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, textColor, currentView, openHeaderMenu, fetchImageRecords, fetchCrossDocRecords]);

  function setSelectModeWithReset(next: boolean) {
    setSelectMode(next);
    if (headerMenuVisible) {
      closeHeaderMenu();
    }
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
      await createCrossDocTaskFromImages(selectedIds);
      toast.success('跨文档分析', '跨文档任务已创建并提交分析');
      setSelectModeWithReset(false);
      if (currentView === 'cross-doc') {
        await fetchCrossDocRecords(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '跨文档分析提交失败';
      toast.error('跨文档分析', message);
    } finally {
      setBatchLoading(false);
    }
  }

  function handleBatchDelete() {
    if (!selectedCount) return;
    setDeleteDialogVisible(true);
  }

  async function confirmBatchDelete() {
    setDeleteDialogVisible(false);
    setBatchLoading(true);

    try {
      if (currentView === 'cross-doc') {
        const results = await Promise.allSettled(selectedIds.map((id) => deleteCrossDocTask(id)));
        const successCount = results.filter((item) => item.status === 'fulfilled').length;
        const failCount = results.length - successCount;

        if (successCount) {
          await fetchCrossDocRecords(true);
          setSelectModeWithReset(false);
        }

        toast.info('删除结果', `已删除 ${successCount} 项${failCount ? `，失败 ${failCount} 项` : ''}`);
        return;
      }

      const results = await Promise.allSettled(selectedIds.map((id) => deleteImageRecord(id)));
      const successCount = results.filter((item) => item.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (successCount) {
        await fetchImageRecords(true);
        setSelectModeWithReset(false);
      }

      toast.info('删除结果', `已删除 ${successCount} 项${failCount ? `，失败 ${failCount} 项` : ''}`);
    } finally {
      setBatchLoading(false);
    }
  }

  function handleViewSelect(view: 'image' | 'cross-doc') {
    setViewSwitchOpen(false);
    setCurrentView(view);
    setSelectModeWithReset(false);
  }

  function handleOpenImageDetail(item: RecordImageItem) {
    router.push({
      pathname: '/image-detail' as any,
      params: {
        imageId: String(item.id),
        title: item.title,
      },
    });
  }

  function handleOpenCrossDocDetail(item: CrossDocRecordItem) {
    router.push({
      pathname: '/cross-doc-detail' as any,
      params: {
        taskId: String(item.id),
        title: item.title,
      },
    });
  }

  function renderImageList() {
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
          <Button variant="outline" size="sm" onPress={() => fetchImageRecords()}>
            重试
          </Button>
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
            onToggleSelect={toggleSelect}
            onPress={handleOpenImageDetail}
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
            onRefresh={() => fetchImageRecords(true)}
            tintColor={textColor}
          />
        }
      />
    );
  }

  function renderCrossDocList() {
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
          <Button variant="outline" size="sm" onPress={() => fetchCrossDocRecords()}>
            重试
          </Button>
        </View>
      );
    }

    return (
      <FlatList
        data={crossDocRecords}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <CrossDocCard
            item={item}
            selectable={selectMode}
            selected={selectedSet.has(item.id)}
            onToggleSelect={toggleSelect}
            onPress={handleOpenCrossDocDetail}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <ThemedText style={{ color: subtleColor }}>暂无跨文档记录</ThemedText>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCrossDocRecords(true)}
            tintColor={textColor}
          />
        }
      />
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBg }]}>
      {currentView === 'image' ? renderImageList() : renderCrossDocList()}

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
          showAnalyze={currentView === 'image'}
        />
      ) : null}

      <Modal
        visible={headerMenuVisible}
        transparent
        animationType="none"
        onRequestClose={closeHeaderMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={closeHeaderMenu}>
          <Animated.View
            style={[
              styles.headerMenuPanel,
              { backgroundColor: menuBg, borderColor: menuBorder },
              { top: insets.top + 6 },
              {
                opacity: menuOpacity,
                transform: [
                  {
                    translateY: menuOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-4, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable style={styles.headerMenuItem} onPress={() => setSelectModeWithReset(!selectMode)}>
              <ThemedText>{selectMode ? '退出多选' : '多选'}</ThemedText>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <AlertDialog
        isVisible={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        title={`删除 ${selectedCount} 项`}
        description={
          currentView === 'image'
            ? `将永久删除所选 ${selectedCount} 份文书及其全部 OCR 结果、结构化数据和知识图谱，此操作不可撤销。`
            : `将永久删除所选 ${selectedCount} 个跨文档分析任务及其关系图，此操作不可撤销。`
        }
        confirmText="确认删除"
        cancelText="取消"
        onConfirm={confirmBatchDelete}
        onCancel={() => setDeleteDialogVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 6,
  },
  headerButton: {
    padding: 6,
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
