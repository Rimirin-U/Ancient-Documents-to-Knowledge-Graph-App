import { AnalysisBottomSheet } from '@/components/image-detail/analysis-bottom-sheet';
import { AnalysisSectionCard } from '@/components/image-detail/analysis-section-card';
import { ImagePreviewPanel } from '@/components/image-detail/image-preview-panel';
import { ModuleActionBar } from '@/components/image-detail/module-action-bar';
import { RelationGraphPanel } from '@/components/image-detail/relation-graph-panel';
import { StructuredContentList } from '@/components/image-detail/structured-content-list';
import { ZoomableImageModal } from '@/components/image-detail/zoomable-image-modal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColor } from '@/hooks/useColor';
import {
  getImageDetailAnalysis,
  ImageDetailAnalysis,
  triggerImageOcr,
  triggerRelationGraphAnalysis,
  triggerStructuredAnalysis,
} from '@/services/analysis';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

const IMAGE_AREA_RATIO = 0.75;

export default function ImageDetailScreen() {
  const navigation = useNavigation();
  const { height } = useWindowDimensions();
  const toast = useToast();
  const pageSurface = useColor('background', { light: '#f6f7f9', dark: '#1d2229' });
  const params = useLocalSearchParams<{ imageId?: string; title?: string }>();

  const imageId = useMemo(() => Number(params.imageId), [params.imageId]);
  const pageTitle = useMemo(() => params.title || '图片详情', [params.title]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysis, setAnalysis] = useState<ImageDetailAnalysis | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedOcrIndex, setSelectedOcrIndex] = useState(0);
  const [selectedStructuredIndex, setSelectedStructuredIndex] = useState(0);
  const [selectedRelationIndex, setSelectedRelationIndex] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: pageTitle,
    });
  }, [navigation, pageTitle]);

  const loadAnalysis = useCallback(async (showLoading = true) => {
    if (!Number.isFinite(imageId)) {
      setErrorMessage('缺少 imageId 参数');
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    setErrorMessage('');

    try {
      const result = await getImageDetailAnalysis(imageId);
      setAnalysis(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载图片详情失败';
      setErrorMessage(message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [imageId]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  useEffect(() => {
    setSelectedOcrIndex((prev) => {
      const max = Math.max(analysis?.ocrList.length ?? 0, 1) - 1;
      return Math.min(prev, max);
    });
    setSelectedStructuredIndex((prev) => {
      const max = Math.max(analysis?.structuredList.length ?? 0, 1) - 1;
      return Math.min(prev, max);
    });
    setSelectedRelationIndex((prev) => {
      const max = Math.max(analysis?.relationGraphList.length ?? 0, 1) - 1;
      return Math.min(prev, max);
    });
  }, [analysis]);

  const selectedOcr = analysis?.ocrList[selectedOcrIndex] ?? null;
  const selectedStructured = analysis?.structuredList[selectedStructuredIndex] ?? null;
  const selectedRelation = analysis?.relationGraphList[selectedRelationIndex] ?? null;

  async function doAction(action: () => Promise<void>, successText: string) {
    setActionLoading(true);
    try {
      await action();
      toast.success('提示', successText);
      await loadAnalysis(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败';
      toast.error('失败', message);
    } finally {
      setActionLoading(false);
    }
  }

  function handleTriggerOcr() {
    if (!Number.isFinite(imageId)) return;
    doAction(() => triggerImageOcr(imageId), 'OCR任务已提交');
  }

  function handleTriggerStructured() {
    if (!selectedOcr?.id) {
      toast.warning('提示', '暂无OCR结果，请先执行识别');
      return;
    }

    doAction(() => triggerStructuredAnalysis(selectedOcr.id), '结构化任务已提交');
  }

  function handleTriggerRelationGraph() {
    if (!selectedStructured?.id) {
      toast.warning('提示', '暂无结构化结果，请先执行结构化分析');
      return;
    }

    doAction(() => triggerRelationGraphAnalysis(selectedStructured.id), '关系图任务已提交');
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

  function handleCopyOcr() {
    copyText(selectedOcr?.rawText ?? '', '暂无可复制的识别结果');
  }

  function handleCopyStructured() {
    copyText(
      selectedStructured?.content ? JSON.stringify(selectedStructured.content, null, 2) : '',
      '暂无可复制的分析结果'
    );
  }

  function handleCopyRelation() {
    copyText(
      selectedRelation?.content ? JSON.stringify(selectedRelation.content, null, 2) : '',
      '暂无可复制的关系图数据'
    );
  }

  const imageHeight = Math.round(height * IMAGE_AREA_RATIO);

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageSurface }]}>
      <View style={[styles.imageArea, { height: imageHeight, backgroundColor: pageSurface }]}>
        <ImagePreviewPanel
          imageUri={analysis?.imageDataUrl}
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
            <Button variant="outline" size="sm" onPress={() => loadAnalysis()}>
              重试
            </Button>
          </View>
        ) : null}

        <AnalysisSectionCard title="识别结果模块" defaultOpen>
          <ThemedText style={styles.statusText}>状态: {selectedOcr?.status ?? '暂无'}</ThemedText>
          {selectedOcr?.rawText ? (
            <ThemedText style={styles.blockText}>{selectedOcr.rawText}</ThemedText>
          ) : (
            <ThemedText style={styles.blockText}>暂无识别结果，点击下方按钮进行识别</ThemedText>
          )}
          <ModuleActionBar
            count={analysis?.ocrList.length ?? 0}
            selectedIndex={selectedOcrIndex}
            onSelect={setSelectedOcrIndex}
            onCopy={handleCopyOcr}
            onRefresh={handleTriggerOcr}
            disabled={actionLoading}
          />
        </AnalysisSectionCard>

        <AnalysisSectionCard title="分析结果模块" defaultOpen>
          <ThemedText style={styles.statusText}>状态: {selectedStructured?.status ?? '暂无'}</ThemedText>
          {selectedStructured?.content ? (
            <StructuredContentList content={selectedStructured.content} />
          ) : (
            <ThemedText style={styles.blockText}>暂无分析结果，点击下方按钮进行分析</ThemedText>
          )}
          <ModuleActionBar
            count={analysis?.structuredList.length ?? 0}
            selectedIndex={selectedStructuredIndex}
            onSelect={setSelectedStructuredIndex}
            onCopy={handleCopyStructured}
            onRefresh={handleTriggerStructured}
            disabled={actionLoading}
          />
        </AnalysisSectionCard>

        <AnalysisSectionCard title="关系图谱模块" defaultOpen>
          <ThemedText style={styles.statusText}>状态: {selectedRelation?.status ?? '暂无'}</ThemedText>
          <RelationGraphPanel content={selectedRelation?.content} />
          <ModuleActionBar
            count={analysis?.relationGraphList.length ?? 0}
            selectedIndex={selectedRelationIndex}
            onSelect={setSelectedRelationIndex}
            onCopy={handleCopyRelation}
            onRefresh={handleTriggerRelationGraph}
            disabled={actionLoading}
          />
        </AnalysisSectionCard>
      </AnalysisBottomSheet>

      <ZoomableImageModal
        visible={previewVisible}
        imageUri={analysis?.imageDataUrl}
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
  statusText: {
    fontSize: 13,
    opacity: 0.75,
  },
  blockText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
