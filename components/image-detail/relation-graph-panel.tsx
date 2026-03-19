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

const CATEGORY_LABELS = ['卖方', '买方', '中人', '地块', '跨角色', '其他'];

function NodeDetailModal({
  node,
  visible,
  onClose,
}: {
  node: NodeClickData | null;
  visible: boolean;
  onClose: () => void;
}) {
  const overlayBg = 'rgba(0,0,0,0.5)';
  const cardBg = useColor('background', { light: '#ffffff', dark: '#1e293b' });
  const borderColor = useColor('icon', { light: '#e2e8f0', dark: '#334155' });
  const textColor = useColor('text', {});
  const subtleColor = useColor('icon', { light: '#64748b', dark: '#94a3b8' });

  if (!node) return null;

  const categoryLabel =
    typeof node.category === 'number' ? (CATEGORY_LABELS[node.category] ?? `类型 ${node.category}`) : '实体';

  const extraProps = node.properties ? Object.entries(node.properties) : [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.modalOverlay, { backgroundColor: overlayBg }]} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: cardBg, borderColor }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>{node.name}</ThemedText>
            <View style={[styles.categoryBadge, { borderColor }]}>
              <ThemedText style={[styles.categoryText, { color: subtleColor }]}>{categoryLabel}</ThemedText>
            </View>
          </View>

          {extraProps.length > 0 && (
            <ScrollView style={styles.propsScroll}>
              {extraProps.map(([key, val]) => (
                <View key={key} style={[styles.propRow, { borderBottomColor: borderColor }]}>
                  <ThemedText style={[styles.propKey, { color: subtleColor }]}>{key}</ThemedText>
                  <ThemedText style={[styles.propVal, { color: textColor }]}>{String(val)}</ThemedText>
                </View>
              ))}
            </ScrollView>
          )}

          <Pressable style={[styles.closeBtn, { backgroundColor: '#0a7ea4' }]} onPress={onClose}>
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

  // ECharts 通过 iframe/WebView JSON 传参，formatter 只能用字符串模板，不能用 JS 函数。
  // 各节点/连线的 label、lineStyle、itemStyle 已由后端按角色单独配置。
  const isDark = scheme === 'dark';
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: isDark ? '#1e293b' : '#fff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f1f5f9' : '#1e293b', fontSize: 12 },
      formatter: '{b}<br/>{c}',
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
        label: {
          show: true,
          position: 'bottom',
          fontSize: 12,
          color: isDark ? '#e2e8f0' : '#1e293b',
        },
        edgeLabel: {
          show: false,
          fontSize: 11,
          fontWeight: 'bold',
          backgroundColor: isDark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.9)',
          borderRadius: 4,
          padding: [3, 6],
          color: isDark ? '#f1f5f9' : '#1e293b',
        },
        lineStyle: {
          curveness: 0.1,
          width: 2,
        },
        force: {
          repulsion: 500,
          edgeLength: [100, 200],
          gravity: 0.15,
          layoutAnimation: true,
          friction: 0.65,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4 },
          label: { show: true, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
        },
        blur: {
          itemStyle: { opacity: 0.25 },
          lineStyle: { opacity: 0.15 },
          label: { opacity: 0.3 },
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
    maxHeight: 160,
  },
  propRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  propKey: {
    fontSize: 12,
    width: 80,
    flexShrink: 0,
  },
  propVal: {
    fontSize: 12,
    flex: 1,
  },
  closeBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
