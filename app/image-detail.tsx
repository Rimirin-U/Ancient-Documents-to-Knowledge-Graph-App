import { AnalysisBottomSheet } from '@/components/image-detail/analysis-bottom-sheet';
import { AnalysisSectionCard } from '@/components/image-detail/analysis-section-card';
import { ImagePreviewPanel } from '@/components/image-detail/image-preview-panel';
import { ModuleActionBar } from '@/components/image-detail/module-action-bar';
import { RelationGraphPanel } from '@/components/image-detail/relation-graph-panel';
import {
  StructuredContentList,
  StructuredDisplayItem,
} from '@/components/image-detail/structured-content-list';
import { ZoomableImageModal } from '@/components/image-detail/zoomable-image-modal';
import { toStructuredDisplayItems } from '@/constants/structured-field-labels';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useColor } from '@/hooks/useColor';
import {
  getImageDataUrl,
  getOcrDetail,
  getOcrIdsByImage,
  getRelationGraphDetail,
  getRelationGraphIdsByStructured,
  getStructuredDetail,
  getStructuredIdsByOcr,
  OcrAnalysis,
  RelationGraphAnalysis,
  StructuredAnalysis,
  triggerImageOcr,
  triggerRelationGraphAnalysis,
  triggerStructuredAnalysis,
  updateOcrResult,
} from '@/services/analysis';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  TextInput,
} from 'react-native';

type AnalysisStatus = 'pending' | 'processing' | 'done' | 'failed';

const STATUS_LABEL: Record<AnalysisStatus, string> = {
  pending: '等待中',
  processing: '处理中',
  done: '已完成',
  failed: '失败',
};

const STATUS_COLOR: Record<AnalysisStatus, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  done: '#10b981',
  failed: '#ef4444',
};

function StatusBadge({ status }: { status: string | undefined }) {
  if (!status) return <ThemedText style={styles.statusText}>状态：暂无</ThemedText>;
  const key = status as AnalysisStatus;
  const label = STATUS_LABEL[key] ?? status;
  const color = STATUS_COLOR[key] ?? '#888';
  const isActive = key === 'pending' || key === 'processing';
  return (
    <View style={styles.statusRow}>
      {isActive && <ActivityIndicator size="small" color={color} style={styles.statusSpinner} />}
      {!isActive && <View style={[styles.statusDot, { backgroundColor: color }]} />}
      <ThemedText style={[styles.statusText, { color }]}>{label}</ThemedText>
    </View>
  );
}

const IMAGE_AREA_RATIO = 0.75;

export default function ImageDetailScreen() {
  const navigation = useNavigation();
  const { userId } = useAuth();
  const { height } = useWindowDimensions();
  const toast = useToast();
  const pageSurface = useColor('background', { light: '#f6f7f9', dark: '#1d2229' });
  const textColor = useColor('text', { light: '#000', dark: '#fff' });
  const params = useLocalSearchParams<{ imageId?: string | string[]; title?: string | string[] }>();

  const imageId = useMemo(() => {
    const raw = params.imageId;
    const s = Array.isArray(raw) ? raw[0] : raw;
    return Number(s);
  }, [params.imageId]);
  const pageTitle = useMemo(() => {
    const raw = params.title;
    const s = Array.isArray(raw) ? raw[0] : raw;
    return s || '图片详情';
  }, [params.title]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [ocrIds, setOcrIds] = useState<number[]>([]);
  const [structuredIds, setStructuredIds] = useState<number[]>([]);
  const [relationGraphIds, setRelationGraphIds] = useState<number[]>([]);
  const [selectedOcr, setSelectedOcr] = useState<OcrAnalysis | null>(null);
  const [selectedStructured, setSelectedStructured] = useState<StructuredAnalysis | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<RelationGraphAnalysis | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedOcrIndex, setSelectedOcrIndex] = useState(0);
  const [selectedStructuredIndex, setSelectedStructuredIndex] = useState(0);
  const [selectedRelationIndex, setSelectedRelationIndex] = useState(0);

  const [isEditingOcr, setIsEditingOcr] = useState(false);
  const [editingOcrText, setEditingOcrText] = useState('');

  /** 避免快速切换记录时，较慢的请求覆盖当前应显示的图片 */
  const activeImageIdRef = useRef(imageId);
  activeImageIdRef.current = imageId;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: pageTitle,
    });
  }, [navigation, pageTitle]);

  const loadBaseData = useCallback(async (showLoading = true) => {
    const targetImageId = imageId;
    if (!Number.isFinite(targetImageId)) {
      setErrorMessage('缺少 imageId 参数');
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
      // 避免从其他记录进入时仍短暂显示上一张 data URL
      setImageDataUrl('');
    }
    setErrorMessage('');

    try {
      const [nextImageDataUrl, nextOcrIds] = await Promise.all([
        getImageDataUrl(targetImageId, userId),
        getOcrIdsByImage(targetImageId),
      ]);

      if (activeImageIdRef.current !== targetImageId) {
        return;
      }

      setImageDataUrl(nextImageDataUrl);
      setOcrIds(nextOcrIds);
      setSelectedOcrIndex(nextOcrIds.length ? nextOcrIds.length - 1 : 0);
    } catch (error) {
      if (activeImageIdRef.current !== targetImageId) {
        return;
      }
      const message = error instanceof Error ? error.message : '加载图片详情失败';
      setErrorMessage(message);
    } finally {
      if (showLoading && activeImageIdRef.current === targetImageId) {
        setLoading(false);
      }
    }
  }, [imageId, userId]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    const max = Math.max(ocrIds.length, 1) - 1;
    setSelectedOcrIndex((prev) => Math.min(prev, max));
  }, [ocrIds.length]);

  useEffect(() => {
    const selectedOcrId = ocrIds[selectedOcrIndex];
    setIsEditingOcr(false);

    if (!selectedOcrId) {
      setSelectedOcr(null);
      setStructuredIds([]);
      setSelectedStructuredIndex(0);
      return;
    }

    let active = true;

    (async () => {
      try {
        const [ocrDetail, nextStructuredIds] = await Promise.all([
          getOcrDetail(selectedOcrId),
          getStructuredIdsByOcr(selectedOcrId),
        ]);
        if (!active) return;

        setSelectedOcr(ocrDetail);
        setStructuredIds(nextStructuredIds);
        setSelectedStructuredIndex(nextStructuredIds.length ? nextStructuredIds.length - 1 : 0);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : '加载OCR详情失败';
        setErrorMessage(message);
      }
    })();

    return () => {
      active = false;
    };
    // OCR 从处理中变为完成时，后端可能刚写入结构化记录；依赖 status 以便自动拉取「分析结果」
  }, [ocrIds, selectedOcrIndex, selectedOcr?.status]);

  useEffect(() => {
    const max = Math.max(structuredIds.length, 1) - 1;
    setSelectedStructuredIndex((prev) => Math.min(prev, max));
  }, [structuredIds.length]);

  useEffect(() => {
    const selectedStructuredId = structuredIds[selectedStructuredIndex];

    if (!selectedStructuredId) {
      setSelectedStructured(null);
      setRelationGraphIds([]);
      setSelectedRelationIndex(0);
      return;
    }

    let active = true;

    (async () => {
      try {
        const [structuredDetail, nextRelationIds] = await Promise.all([
          getStructuredDetail(selectedStructuredId),
          getRelationGraphIdsByStructured(selectedStructuredId),
        ]);

        if (!active) return;
        setSelectedStructured(structuredDetail);
        setRelationGraphIds(nextRelationIds);
        setSelectedRelationIndex(nextRelationIds.length ? nextRelationIds.length - 1 : 0);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : '加载结构化详情失败';
        setErrorMessage(message);
      }
    })();

    return () => {
      active = false;
    };
    // 结构化完成后自动拉取关系图 ID，配合后端流水线无需手动点刷新
  }, [structuredIds, selectedStructuredIndex, selectedStructured?.status]);

  useEffect(() => {
    const max = Math.max(relationGraphIds.length, 1) - 1;
    setSelectedRelationIndex((prev) => Math.min(prev, max));
  }, [relationGraphIds.length]);

  useEffect(() => {
    const selectedRelationId = relationGraphIds[selectedRelationIndex];

    if (!selectedRelationId) {
      setSelectedRelation(null);
      return;
    }

    let active = true;

    (async () => {
      try {
        const relationDetail = await getRelationGraphDetail(selectedRelationId);
        if (!active) return;
        setSelectedRelation(relationDetail);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : '加载关系图详情失败';
        setErrorMessage(message);
      }
    })();

    return () => {
      active = false;
    };
  }, [relationGraphIds, selectedRelationIndex]);

  // 最大轮询次数（约 90 秒后停止）
  const MAX_POLL_COUNT = 20;

  // 轮询：OCR 处理中时自动刷新（指数退避：1.5s → 3s → 6s → 最大 10s）
  const ocrRetryCount = useRef(0);
  useEffect(() => {
    if (!selectedOcr || selectedOcr.status === 'done' || selectedOcr.status === 'failed') {
      ocrRetryCount.current = 0;
      return;
    }
    if (ocrRetryCount.current >= MAX_POLL_COUNT) {
      toast.warning('提示', 'OCR 识别超时，请稍后手动刷新重试');
      return;
    }
    const delay = Math.min(1500 * Math.pow(1.5, ocrRetryCount.current), 10000);
    const timer = setTimeout(async () => {
      try {
        const updated = await getOcrDetail(selectedOcr.id);
        ocrRetryCount.current += 1;
        setSelectedOcr(updated);
      } catch {}
    }, delay);
    return () => clearTimeout(timer);
  }, [selectedOcr]);

  // 轮询：结构化分析处理中时自动刷新（指数退避）
  const structuredRetryCount = useRef(0);
  useEffect(() => {
    if (!selectedStructured || selectedStructured.status === 'done' || selectedStructured.status === 'failed') {
      structuredRetryCount.current = 0;
      return;
    }
    if (structuredRetryCount.current >= MAX_POLL_COUNT) {
      toast.warning('提示', '结构化分析超时，请稍后手动刷新重试');
      return;
    }
    const delay = Math.min(1500 * Math.pow(1.5, structuredRetryCount.current), 10000);
    const timer = setTimeout(async () => {
      try {
        const updated = await getStructuredDetail(selectedStructured.id);
        structuredRetryCount.current += 1;
        setSelectedStructured(updated);
      } catch {}
    }, delay);
    return () => clearTimeout(timer);
  }, [selectedStructured]);

  // 轮询：关系图处理中时自动刷新（指数退避）
  const relationRetryCount = useRef(0);
  useEffect(() => {
    if (!selectedRelation || selectedRelation.status === 'done' || selectedRelation.status === 'failed') {
      relationRetryCount.current = 0;
      return;
    }
    if (relationRetryCount.current >= MAX_POLL_COUNT) {
      toast.warning('提示', '知识图谱生成超时，请稍后手动刷新重试');
      return;
    }
    const delay = Math.min(1500 * Math.pow(1.5, relationRetryCount.current), 10000);
    const timer = setTimeout(async () => {
      try {
        const updated = await getRelationGraphDetail(selectedRelation.id);
        relationRetryCount.current += 1;
        setSelectedRelation(updated);
      } catch {}
    }, delay);
    return () => clearTimeout(timer);
  }, [selectedRelation]);

  async function doAction(action: () => Promise<void>, successText: string, onSuccess?: () => Promise<void>) {
    setActionLoading(true);
    try {
      await action();
      toast.success('提示', successText);
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败';
      toast.error('失败', message);
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * 识别结果区「刷新」：始终 POST 触发 OCR（与后端「重新识别」一致），
   * 轮询直到出现新的 OcrResult 记录（Worker 开始时即写入 PROCESSING 行）或超时。
   */
  async function handleOcrRefresh() {
    if (!Number.isFinite(imageId)) return;
    setActionLoading(true);
    try {
      const beforeIds = await getOcrIdsByImage(imageId);
      const beforeSet = new Set(beforeIds);

      await triggerImageOcr(imageId);
      toast.success('提示', '识别任务已提交，等待 Worker 写入记录…');

      let ids = beforeIds;
      let sawNew = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise((r) => setTimeout(r, 450));
        ids = await getOcrIdsByImage(imageId);
        sawNew = ids.some((id) => !beforeSet.has(id));
        if (sawNew || (beforeIds.length === 0 && ids.length > 0)) {
          break;
        }
      }

      if (!sawNew && beforeIds.length === 0 && ids.length === 0) {
        toast.warning(
          '提示',
          '仍未出现识别记录。请确认服务器已启动 Celery Worker（需 Redis），并已配置 DASHSCOPE_API_KEY；也可稍后再次点刷新。',
        );
      } else if (!sawNew && beforeIds.length > 0) {
        toast.warning(
          '提示',
          '暂未检测到新的识别记录，可能队列繁忙或 Worker 未消费任务，请稍后再试。',
        );
      }

      setOcrIds(ids);
      setSelectedOcrIndex((prev) => {
        if (!ids.length) return 0;
        const newOnes = ids.filter((id) => !beforeSet.has(id));
        if (newOnes.length) {
          const newestId = Math.max(...newOnes);
          const idx = ids.indexOf(newestId);
          return idx >= 0 ? idx : ids.length - 1;
        }
        if (beforeIds.length === 0 && ids.length > 0) {
          return ids.length - 1;
        }
        return Math.min(prev, ids.length - 1);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败';
      toast.error('失败', message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTriggerStructured() {
    if (!selectedOcr?.id) {
      toast.warning('提示', '暂无OCR结果，请先执行识别');
      return;
    }

    setActionLoading(true);
    try {
      await triggerStructuredAnalysis(selectedOcr.id);
      toast.success('提示', '结构化任务已提交');

      if (structuredIds.length === 0) {
        let nextStructuredIds: number[] = [];
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise((r) => setTimeout(r, 400));
          nextStructuredIds = await getStructuredIdsByOcr(selectedOcr.id);
          if (nextStructuredIds.length > 0) break;
        }
        setStructuredIds(nextStructuredIds);
        setSelectedStructuredIndex(nextStructuredIds.length ? nextStructuredIds.length - 1 : 0);
      } else {
        const currentId = structuredIds[selectedStructuredIndex];
        if (currentId) {
          await new Promise((r) => setTimeout(r, 500));
          const updated = await getStructuredDetail(currentId);
          setSelectedStructured(updated);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败';
      toast.error('失败', message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTriggerRelationGraph() {
    if (!selectedStructured?.id) {
      toast.warning('提示', '暂无结构化结果，请先执行结构化分析');
      return;
    }

    setActionLoading(true);
    try {
      await triggerRelationGraphAnalysis(selectedStructured.id);
      toast.success('提示', '关系图任务已提交');

      if (relationGraphIds.length === 0) {
        let nextRelationIds: number[] = [];
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise((r) => setTimeout(r, 400));
          nextRelationIds = await getRelationGraphIdsByStructured(selectedStructured.id);
          if (nextRelationIds.length > 0) break;
        }
        setRelationGraphIds(nextRelationIds);
        setSelectedRelationIndex(nextRelationIds.length ? nextRelationIds.length - 1 : 0);
      } else {
        const currentId = relationGraphIds[selectedRelationIndex];
        if (currentId) {
          await new Promise((r) => setTimeout(r, 500));
          const updated = await getRelationGraphDetail(currentId);
          setSelectedRelation(updated);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败';
      toast.error('失败', message);
    } finally {
      setActionLoading(false);
    }
  }

  async function copyText(value: string, emptyHint: string) {
    const text = value.trim();
    if (!text) {
      toast.warning('提示', emptyHint);
      return;
    }

    if (Platform.OS === 'web' && globalThis.navigator?.clipboard) {
      await globalThis.navigator.clipboard.writeText(text);
    } else {
      await Clipboard.setStringAsync(text);
    }
    toast.success('提示', '已复制到剪贴板');
  }

  async function copyStructuredValue(value: string) {
    const text = value.trim();
    if (!text) {
      toast.warning('提示', '暂无可复制内容');
      return;
    }

    if (Platform.OS === 'web' && globalThis.navigator?.clipboard) {
      await globalThis.navigator.clipboard.writeText(text);
    } else {
      await Clipboard.setStringAsync(text);
    }

    const hint = text.length > 24 ? `${text.slice(0, 24)}...` : text;
    toast.success('提示', `已复制“${hint}”`);
  }

  function handleCopyOcr() {
    copyText(selectedOcr?.rawText ?? '', '暂无可复制的识别结果');
  }

  function handleEditOcr() {
    if (!selectedOcr) return;
    setEditingOcrText(selectedOcr.rawText);
    setIsEditingOcr(true);
  }

  async function handleSaveOcr() {
    if (!selectedOcr) return;
    setActionLoading(true);
    try {
      const updated = await updateOcrResult(selectedOcr.id, editingOcrText);
      setSelectedOcr(updated);
      setIsEditingOcr(false);
      toast.success('提示', '识别结果修改成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '修改失败';
      toast.error('失败', message);
    } finally {
      setActionLoading(false);
    }
  }

  function handleCancelEditOcr() {
    setIsEditingOcr(false);
    setEditingOcrText('');
  }

  const translatedStructuredItems = useMemo<StructuredDisplayItem[]>(() => {
    return toStructuredDisplayItems(selectedStructured?.content);
  }, [selectedStructured?.content]);

  const imageHeight = Math.round(height * IMAGE_AREA_RATIO);

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageSurface }]}>
      <View style={[styles.imageArea, { height: imageHeight, backgroundColor: pageSurface }]}>
        <ImagePreviewPanel
          imageUri={imageDataUrl}
          recyclingKey={Number.isFinite(imageId) ? `detail-${imageId}` : undefined}
          loading={loading}
          onPressImage={() => setPreviewVisible(true)}
        />
      </View>

      <AnalysisBottomSheet collapsedTopRatio={IMAGE_AREA_RATIO} expandedTopRatio={0.2}>
        {loading ? (
          <View style={styles.centeredWrap}>
            <Skeleton width="100%" height={48} />
            <Skeleton width="70%" height={16} />
            <ThemedText>加载分析结果中...</ThemedText>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.centeredWrap}>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            <Button variant="outline" size="sm" onPress={() => loadBaseData()}>
              重试
            </Button>
          </View>
        ) : null}

        <AnalysisSectionCard title="识别结果" defaultOpen>
          <StatusBadge status={selectedOcr?.status} />
          {selectedOcr?.status === 'processing' || selectedOcr?.status === 'pending' ? (
            <View style={styles.processingWrap}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <ThemedText style={styles.processingText}>识别进行中，请稍候...</ThemedText>
            </View>
          ) : selectedOcr?.rawText ? (
            <View>
              {isEditingOcr ? (
                <View>
                  <TextInput
                    style={[styles.ocrTextInput, { color: textColor }]}
                    multiline
                    value={editingOcrText}
                    onChangeText={setEditingOcrText}
                  />
                  <View style={styles.editActionRow}>
                    <Button variant="outline" size="sm" onPress={handleCancelEditOcr} disabled={actionLoading}>
                      取消
                    </Button>
                    <Button size="sm" onPress={handleSaveOcr} disabled={actionLoading}>
                      保存
                    </Button>
                  </View>
                </View>
              ) : (
                <ScrollView style={styles.ocrScrollView} nestedScrollEnabled>
                  <ThemedText style={styles.ocrText} selectable>
                    {selectedOcr.rawText}
                  </ThemedText>
                </ScrollView>
              )}
            </View>
          ) : (
            <ThemedText style={styles.hintText}>
              暂无识别结果：点右侧刷新将提交识别并轮询记录；已有结果时点刷新会重新识别；若 Worker 未启动则不会生成结果。
            </ThemedText>
          )}
          <ModuleActionBar
            count={ocrIds.length}
            selectedIndex={selectedOcrIndex}
            onSelect={setSelectedOcrIndex}
            onCopy={handleCopyOcr}
            onEdit={!isEditingOcr && selectedOcr?.rawText ? handleEditOcr : undefined}
            onRefresh={handleOcrRefresh}
            disabled={actionLoading}
          />
        </AnalysisSectionCard>

        <AnalysisSectionCard title="分析结果" defaultOpen>
          <StatusBadge status={selectedStructured?.status} />
          {selectedStructured?.status === 'processing' || selectedStructured?.status === 'pending' ? (
            <View style={styles.processingWrap}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <ThemedText style={styles.processingText}>分析进行中，请稍候...</ThemedText>
            </View>
          ) : translatedStructuredItems.length ? (
            <StructuredContentList items={translatedStructuredItems} onCopyValue={copyStructuredValue} />
          ) : (
            <ThemedText style={styles.hintText}>
              识别完成后将自动结构化分析；若暂无结果可点右侧刷新手动触发。
            </ThemedText>
          )}
          <ModuleActionBar
            count={structuredIds.length}
            selectedIndex={selectedStructuredIndex}
            onSelect={setSelectedStructuredIndex}
            onRefresh={handleTriggerStructured}
            disabled={actionLoading}
          />
        </AnalysisSectionCard>

        <AnalysisSectionCard title="关系图谱" defaultOpen>
          <StatusBadge status={selectedRelation?.status} />
          {selectedRelation?.status === 'processing' || selectedRelation?.status === 'pending' ? (
            <View style={styles.processingWrap}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <ThemedText style={styles.processingText}>图谱生成中，请稍候...</ThemedText>
            </View>
          ) : relationGraphIds.length === 0 ? (
            <ThemedText style={styles.hintText}>
              等待结构化完成后将自动生成关系图；也可在结构化就绪后点右侧刷新。
            </ThemedText>
          ) : (
            <RelationGraphPanel content={selectedRelation?.content} />
          )}
          <ModuleActionBar
            count={relationGraphIds.length}
            selectedIndex={selectedRelationIndex}
            onSelect={setSelectedRelationIndex}
            onRefresh={handleTriggerRelationGraph}
            disabled={actionLoading}
          />
        </AnalysisSectionCard>
      </AnalysisBottomSheet>

      <ZoomableImageModal
        visible={previewVisible}
        imageUri={imageDataUrl}
        onClose={() => setPreviewVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageArea: {
    width: '100%',
  },
  centeredWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  errorText: {
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusSpinner: {
    width: 14,
    height: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  processingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  processingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.6,
    paddingVertical: 4,
  },
  ocrScrollView: {
    maxHeight: 180,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 2,
  },
  ocrText: {
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 8,
    paddingVertical: 8,
    letterSpacing: 0.3,
  },
  ocrTextInput: {
    minHeight: 100,
    maxHeight: 180,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 8,
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  editActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
