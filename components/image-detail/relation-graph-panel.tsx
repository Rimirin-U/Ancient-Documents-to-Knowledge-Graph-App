import { Chart, NodeClickData } from '@/components/echarts/echarts';
import { ThemedText } from '@/components/themed-text';
import { useColor } from '@/hooks/useColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

type RelationGraphPanelProps = {
  content: unknown;
};

type GraphContent = {
  nodes: ({ name?: string; category?: number } & Record<string, unknown>)[];
  links: Record<string, unknown>[];
  categories: { name: string }[];
};

// 兼容旧数据的英文分类名翻译
const CATEGORY_NAME_ZH: Record<string, string> = {
  Seller: '卖方',
  Buyer: '买方',
  Middleman: '中人',
  Other: '其他',
};

function toGraphContent(content: unknown): GraphContent | null {
  if (!content || typeof content !== 'object') return null;

  const candidate = content as Record<string, unknown>;

  let nodes: any[] = [];
  let links: any[] = [];
  let categoriesSource: any[] = [];

  if (Array.isArray(candidate.nodes)) {
    nodes = candidate.nodes;
    links = Array.isArray(candidate.links) ? candidate.links : [];
    categoriesSource = Array.isArray(candidate.categories) ? candidate.categories : [];
  } else if (Array.isArray(candidate.series) && candidate.series.length > 0) {
    const graphSeries = (candidate.series as any[]).find((s) => s.type === 'graph');
    if (graphSeries) {
      nodes = Array.isArray(graphSeries.data) ? graphSeries.data : [];
      links = Array.isArray(graphSeries.links) ? graphSeries.links : [];
      categoriesSource = Array.isArray(graphSeries.categories) ? graphSeries.categories : [];
    }
  }

  if (!nodes.length) return null;

  // 旧数据兼容：links 的 source/target 可能是 "{id}_{name}" 格式，映射为 name
  const idToName: Record<string, string> = {};
  for (const node of nodes) {
    const nodeId = node.id !== undefined ? String(node.id) : null;
    const nodeName = node.name !== undefined ? String(node.name) : null;
    if (nodeId && nodeName) idToName[nodeId] = nodeName;
  }
  const fixedLinks = links.map((link: any) => {
    const src = String(link.source ?? '');
    const tgt = String(link.target ?? '');
    return {
      ...link,
      source: idToName[src] ?? src,
      target: idToName[tgt] ?? tgt,
    };
  });

  // 关键：去掉节点的 id 字段。
  // ECharts 节点有 id 时会优先用 id 匹配连线端点，
  // 映射后的 source/target 是 name 而非 id，会导致连线断开。
  // 去掉 id 后 ECharts 只能按 name 匹配，连线正常。
  const fixedNodes = nodes.map((node: any) => {
    const { id: _removed, ...rest } = node;
    return {
      ...rest,
      name: node.name !== undefined ? String(node.name) : String(node.id ?? ''),
      symbolSize: node.symbolSize ?? 30,
    };
  });

  const categories =
    categoriesSource.length > 0
      ? categoriesSource.map((c: { name: string }) => ({
          name: CATEGORY_NAME_ZH[c.name] ?? c.name,
        }))
      : Array.from(
          new Set(nodes.map((node) => String((node as any).category ?? '实体')))
        ).map((name) => ({ name }));

  return { nodes: fixedNodes, links: fixedLinks, categories };
}

// 分类索引 → 中文标签及颜色（与后端 categories 数组对应）
const CATEGORY_META: Record<number, { label: string; color: string }> = {
  0: { label: '卖方', color: '#dc2626' },
  1: { label: '买方', color: '#2563eb' },
  2: { label: '中人', color: '#059669' },
  3: { label: '契约', color: '#d97706' },
  4: { label: '信息', color: '#7c3aed' },
};

function NodeDetailModal({
  node,
  visible,
  onClose,
}: {
  node: NodeClickData | null;
  visible: boolean;
  onClose: () => void;
}) {
  const overlayBg = 'rgba(0,0,0,0.55)';
  const cardBg = useColor('background', { light: '#ffffff', dark: '#1e293b' });
  const borderColor = useColor('icon', { light: '#e2e8f0', dark: '#334155' });
  const textColor = useColor('text', {});
  const subtleColor = useColor('icon', { light: '#64748b', dark: '#94a3b8' });
  const rowBg = useColor('background', { light: '#f8fafc', dark: '#0f172a' });

  if (!node) return null;

  const meta = typeof node.category === 'number' ? CATEGORY_META[node.category] : null;
  const categoryLabel = meta?.label ?? '实体';
  const badgeColor = meta?.color ?? '#64748b';

  // 信息节点的 name 是内部 ID（__info_xxx），对用户显示第一条属性值或 category 名
  const isInfoNode = node.category === 4;
  const props = node.properties ?? {};
  const firstPropValue = Object.values(props)[0];
  const displayName = isInfoNode && firstPropValue
    ? String(firstPropValue)
    : node.name;

  // 属性列表：过滤掉空值
  const extraProps = Object.entries(props).filter(
    ([, v]) => v !== null && v !== undefined && String(v).trim() !== ''
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.modalOverlay, { backgroundColor: overlayBg }]} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: cardBg, borderColor }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* 标题行 */}
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]} numberOfLines={2}>
              {displayName}
            </ThemedText>
            <View style={[styles.categoryBadge, { backgroundColor: badgeColor + '1a', borderColor: badgeColor + '55' }]}>
              <ThemedText style={[styles.categoryText, { color: badgeColor }]}>{categoryLabel}</ThemedText>
            </View>
          </View>

          {/* 属性列表
              信息节点（时间/地点/价格/标的）只有一个属性，其值已作为标题展示，
              不再重复显示属性行，改为展示简短的字段说明 */}
          {isInfoNode ? (
            <ThemedText style={[styles.infoNodeHint, { color: subtleColor }]}>
              {categoryLabel}属性 · 点击空白处关闭
            </ThemedText>
          ) : extraProps.length > 0 ? (
            <ScrollView style={styles.propsScroll} showsVerticalScrollIndicator={false}>
              {extraProps.map(([key, val], idx) => (
                <View
                  key={key}
                  style={[
                    styles.propRow,
                    { borderBottomColor: borderColor },
                    idx % 2 === 0 && { backgroundColor: rowBg },
                  ]}
                >
                  <ThemedText style={[styles.propKey, { color: subtleColor }]}>{key}</ThemedText>
                  <ThemedText style={[styles.propVal, { color: textColor }]}>{String(val)}</ThemedText>
                </View>
              ))}
            </ScrollView>
          ) : (
            <ThemedText style={[styles.emptyProps, { color: subtleColor }]}>暂无详细信息</ThemedText>
          )}

          <Pressable style={[styles.closeBtn, { backgroundColor: badgeColor }]} onPress={onClose}>
            <ThemedText style={styles.closeBtnText}>关闭</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function RelationGraphPanel({ content }: RelationGraphPanelProps) {
  const scheme = useColorScheme() ?? 'light';
  const graphContent = toGraphContent(content);
  const [selectedNode, setSelectedNode] = useState<NodeClickData | null>(null);

  if (!graphContent) {
    return <ThemedText>暂无可渲染关系图，点击下方按钮可重新生成</ThemedText>;
  }

  // ECharts 通过 WebView JSON 传参，各节点/连线的 label、lineStyle、itemStyle 已由后端按角色配置。
  // 前端只负责全局样式（主题色、force 参数等），per-node 样式以后端数据为准。
  const isDark = scheme === 'dark';
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: isDark ? '#1e293b' : '#fff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f1f5f9' : '#1e293b', fontSize: 12 },
      formatter: '{b}',
    },
    legend: {
      data: graphContent.categories.map((item) => item.name),
      bottom: 4,
      textStyle: { fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' },
      itemWidth: 12,
      itemHeight: 12,
      icon: 'circle',
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: graphContent.nodes,
        links: graphContent.links,
        categories: graphContent.categories,
        roam: true,
        // 全局标签默认（per-node label 会覆盖此处）
        label: {
          show: true,
          position: 'bottom',
          fontSize: 12,
          color: isDark ? '#e2e8f0' : '#1e293b',
        },
        // 边标签：系列级默认关闭，只有后端显式标记 label.show=true 的边才展示
        // （人物关系边显示"出卖/归属/见证/出售"，信息属性边不显示，避免重复）
        edgeLabel: {
          show: false,
          fontSize: 11,
          fontWeight: 'bold',
          backgroundColor: isDark ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.88)',
          borderRadius: 4,
          padding: [2, 6],
          color: isDark ? '#f1f5f9' : '#1e293b',
        },
        lineStyle: {
          curveness: 0.1,
          width: 2,
          opacity: 0.85,
        },
        force: {
          repulsion: 600,
          edgeLength: [120, 220],
          gravity: 0.12,
          layoutAnimation: true,
          friction: 0.6,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4, opacity: 1 },
          label: { show: true, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 14, shadowColor: 'rgba(0,0,0,0.35)' },
        },
        blur: {
          itemStyle: { opacity: 0.2 },
          lineStyle: { opacity: 0.1 },
          label: { opacity: 0.25 },
        },
      },
    ],
  };

  return (
    <>
      <Chart
        option={option}
        onGesture={() => {}}
        theme={scheme}
        onNodeClick={(node) => setSelectedNode(node)}
      />
      <NodeDetailModal
        node={selectedNode}
        visible={!!selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  propsScroll: {
    maxHeight: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  propRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  propKey: {
    fontSize: 12,
    width: 72,
    flexShrink: 0,
    fontWeight: '500',
  },
  propVal: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  emptyProps: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  infoNodeHint: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 4,
  },
  closeBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
