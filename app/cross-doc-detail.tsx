import {
  CrossDocImageGalleryItem,
  ImageGallerySection,
} from '@/components/cross-doc-detail/image-gallery-section';
import { CrossDocInsightsPanel } from '@/components/cross-doc-detail/insights-panel';
import { ImageInfoSheet } from '@/components/cross-doc-detail/image-info-sheet';
import { AnalysisSectionCard } from '@/components/image-detail/analysis-section-card';
import { ModuleActionBar } from '@/components/image-detail/module-action-bar';
import { RelationGraphPanel } from '@/components/image-detail/relation-graph-panel';
import {
  StructuredContentList,
  StructuredDisplayItem,
} from '@/components/image-detail/structured-content-list';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { toStructuredDisplayItems } from '@/constants/structured-field-labels';
import { useColor } from '@/hooks/useColor';
import {
  getImageDataUrl,
  getOcrDetail,
  getStructuredDetail,
  StructuredAnalysis,
} from '@/services/analysis';
import {
  getImageInfo,
  getMultiRelationGraphDetail,
  getMultiRelationGraphIdsByTask,
  getMultiTaskDetail,
  MultiRelationGraphAnalysis,
  triggerMultiRelationGraphAnalysis,
} from '@/services/cross-doc';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function CrossDocDetailScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string; title?: string }>();
  const toast = useToast();

  const pageBg = useColor('background', { light: '#f6f7f9', dark: '#1d2229' });

  const taskId = useMemo(() => Number(params.taskId), [params.taskId]);
  const pageTitle = useMemo(() => params.title || '跨文档详情', [params.title]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [images, setImages] = useState<CrossDocImageGalleryItem[]>([]);
  const [structuredList, setStructuredList] = useState<StructuredAnalysis[]>([]);
  const [relationList, setRelationList] = useState<MultiRelationGraphAnalysis[]>([]);

  const [selectedStructuredIndex, setSelectedStructuredIndex] = useState(0);
  const [selectedRelationIndex, setSelectedRelationIndex] = useState(0);

  const [infoSheetVisible, setInfoSheetVisible] = useState(false);
  const [selectedInfoImage, setSelectedInfoImage] = useState<CrossDocImageGalleryItem | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: pageTitle,
    });
  }, [navigation, pageTitle]);

  const loadData = useCallback(async (showLoading = true) => {
    if (!Number.isFinite(taskId)) {
      setErrorMessage('缺少 taskId 参数');
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    setErrorMessage('');

    try {
      const taskDetail = await getMultiTaskDetail(taskId);

      const nextStructuredList = await Promise.all(
        taskDetail.structuredResultIds.map((id) => getStructuredDetail(id))
      );

      const ocrList = await Promise.all(
        nextStructuredList.map((structured) => getOcrDetail(structured.ocrResultId))
      );

      const uniqueImageIds = Array.from(new Set(ocrList.map((ocr) => ocr.imageId)));

      const nextImages = await Promise.all(
        uniqueImageIds.map(async (imageId) => {
          const [info, imageDataUrl] = await Promise.all([
            getImageInfo(imageId),
            getImageDataUrl(imageId),
          ]);

          return {
            id: imageId,
            title: info.title || `图片 ${imageId}`,
            filename: info.filename,
            uploadTime: info.uploadTime,
            imageDataUrl,
          } satisfies CrossDocImageGalleryItem;
        })
      );

      const relationIds = await getMultiRelationGraphIdsByTask(taskId, 50);
      const nextRelationList = await Promise.all(
        relationIds.map((id) => getMultiRelationGraphDetail(id))
      );

      setImages(nextImages);
      setStructuredList(nextStructuredList);
      setRelationList(nextRelationList);

      setSelectedStructuredIndex(nextStructuredList.length ? nextStructuredList.length - 1 : 0);
      setSelectedRelationIndex(nextRelationList.length ? nextRelationList.length - 1 : 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载跨文档详情失败';
      setErrorMessage(message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [taskId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const max = Math.max(structuredList.length, 1) - 1;
    setSelectedStructuredIndex((prev) => Math.min(prev, max));
  }, [structuredList.length]);

  useEffect(() => {
    const max = Math.max(relationList.length, 1) - 1;
    setSelectedRelationIndex((prev) => Math.min(prev, max));
  }, [relationList.length]);

  const selectedStructured = structuredList[selectedStructuredIndex] ?? null;
  const selectedRelation = relationList[selectedRelationIndex] ?? null;

  const translatedStructuredItems = useMemo<StructuredDisplayItem[]>(() => {
    return toStructuredDisplayItems(selectedStructured?.content);
  }, [selectedStructured?.content]);

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

  async function handleTriggerRelationGraph() {
    if (!Number.isFinite(taskId)) return;
    setActionLoading(true);
    try {
      await triggerMultiRelationGraphAnalysis(taskId);
      toast.success('提示', '跨文档关系图任务已提交');
      await loadData(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '触发跨文档关系图分析失败';
      toast.error('失败', message);
    } finally {
      setActionLoading(false);
    }
  }

  function handleImagePressed(image: CrossDocImageGalleryItem) {
    setSelectedInfoImage(image);
    setInfoSheetVisible(true);
  }

  function handleImageDetail(image: CrossDocImageGalleryItem) {
    setInfoSheetVisible(false);
    router.push({
      pathname: '/image-detail' as any,
      params: {
        imageId: String(image.id),
        title: image.title,
      },
    });
  }

  function handleImageDownload(image: CrossDocImageGalleryItem) {
    toast.info('下载', `已选择下载：${image.title}`);
  }

  async function handleExportCSV() {
    if (!structuredList.length) {
      toast.warning('提示', '暂无数据可导出');
      return;
    }
    try {
      const headers = ['文书ID', '时间', '地点', '卖方', '买方', '中人', '价格', '标的'];
      const rows = structuredList.map(item => {
        try {
          const content = JSON.parse(item.content);
          return [
            item.id,
            content.Time || '',
            content.Location || '',
            content.Seller || '',
            content.Buyer || '',
            content.Middleman || '',
            content.Price || '',
            content.Subject || '',
          ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        } catch {
          return '';
        }
      }).filter(Boolean);
      
      const csvContent = [headers.join(','), ...rows].join('\n');
      
      if (Platform.OS === 'web') {
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cross_doc_export_${taskId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('导出成功', 'CSV文件已下载');
      } else {
        await Clipboard.setStringAsync(csvContent);
        toast.success('导出成功', 'CSV内容已复制到剪贴板，可粘贴至Excel');
      }
    } catch (e) {
      toast.error('导出失败', '生成CSV时发生错误');
    }
  }

  async function handleExportGraphJSON() {
    if (!selectedRelation?.content) {
      toast.warning('提示', '暂无图谱数据可导出');
      return;
    }
    try {
      const jsonContent = typeof selectedRelation.content === 'string' 
        ? selectedRelation.content 
        : JSON.stringify(selectedRelation.content, null, 2);
        
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `graph_export_${taskId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('导出成功', '图谱JSON文件已下载');
      } else {
        await Clipboard.setStringAsync(jsonContent);
        toast.success('导出成功', '图谱JSON已复制到剪贴板');
      }
    } catch (e) {
      toast.error('导出失败', '生成JSON时发生错误');
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBg }]}>
      {loading ? (
        <View style={styles.centeredWrap}>
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={120} />
          <ThemedText>加载跨文档详情中...</ThemedText>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.centeredWrap}>
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          <Button variant="outline" size="sm" onPress={() => loadData()}>
            重试
          </Button>
        </View>
      ) : null}

      {!loading && !errorMessage ? (
        <ScrollView contentContainerStyle={styles.contentWrap}>
          <ImageGallerySection
            images={images}
            onPressImage={handleImagePressed}
          />

          <AnalysisSectionCard title="文档结构化分析" defaultOpen>
            <ThemedText style={styles.statusText}>状态: {selectedStructured?.status ?? '暂无'}</ThemedText>
            {translatedStructuredItems.length ? (
              <StructuredContentList items={translatedStructuredItems} onCopyValue={copyStructuredValue} />
            ) : (
              <ThemedText style={styles.blockText}>暂无分析结果</ThemedText>
            )}
            <ModuleActionBar
              count={structuredList.length}
              selectedIndex={selectedStructuredIndex}
              onSelect={setSelectedStructuredIndex}
              onRefresh={() => loadData(false)}
              disabled={actionLoading}
            />
          </AnalysisSectionCard>

          <AnalysisSectionCard title="跨文档关系图谱" defaultOpen>
            <ThemedText style={styles.statusText}>状态: {selectedRelation?.status ?? '暂无'}</ThemedText>
            <RelationGraphPanel content={selectedRelation?.content} />
            <ModuleActionBar
              count={relationList.length}
              selectedIndex={selectedRelationIndex}
              onSelect={setSelectedRelationIndex}
              onRefresh={handleTriggerRelationGraph}
              disabled={actionLoading}
            />
          </AnalysisSectionCard>

          {(selectedRelation?.statistics || selectedRelation?.insights) && (
            <AnalysisSectionCard title="分析洞察" defaultOpen>
              <CrossDocInsightsPanel
                statistics={selectedRelation.statistics}
                insights={selectedRelation.insights}
              />
            </AnalysisSectionCard>
          )}

          <AnalysisSectionCard title="数据导出" defaultOpen>
            <ThemedText style={styles.blockText}>
              支持将结构化数据和关系图谱导出，便于在 Excel 或 Gephi 等学术软件中进一步分析。
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Button style={{ flex: 1 }} variant="secondary" onPress={handleExportCSV}>
                导出结构化 CSV
              </Button>
              <Button style={{ flex: 1 }} variant="secondary" onPress={handleExportGraphJSON}>
                导出图谱 JSON
              </Button>
            </View>
          </AnalysisSectionCard>
        </ScrollView>
      ) : null}

      <ImageInfoSheet
        visible={infoSheetVisible}
        imageInfo={selectedInfoImage}
        onClose={() => setInfoSheetVisible(false)}
        onPressDetail={handleImageDetail}
        onPressDownload={handleImageDownload}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrap: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    paddingBottom: 36,
  },
  centeredWrap: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
  errorText: {
    color: '#d14a4a',
  },
  statusText: {
    fontSize: 13,
    opacity: 0.75,
  },
  blockText: {
    lineHeight: 20,
  },
});
