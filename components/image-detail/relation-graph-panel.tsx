import { Chart } from '@/components/echarts/echarts';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/useColorScheme';

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

export function RelationGraphPanel({ content }: RelationGraphPanelProps) {
  const scheme = useColorScheme() ?? 'light';
  const graphContent = toGraphContent(content);

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
        // 系列级默认标签（节点自身 label 属性会覆盖此处）
        label: {
          show: true,
          position: 'bottom',
          fontSize: 12,
          color: isDark ? '#e2e8f0' : '#1e293b',
        },
        // 边标签：默认隐藏，各连线通过自身 label.show/formatter 单独控制
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
        // 辐射拓扑参数：大斥力撑开节点，适度重力让契约节点居中
        force: {
          repulsion: 500,
          edgeLength: [100, 200],
          gravity: 0.15,
          layoutAnimation: true,
          friction: 0.65,
        },
        // 点击/悬停高亮邻接关系
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4 },
          label: { show: true, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
        },
        // 非焦点节点变暗，突出当前选中
        blur: {
          itemStyle: { opacity: 0.25 },
          lineStyle: { opacity: 0.15 },
          label: { opacity: 0.3 },
        },
      },
    ],
  };

  return <Chart option={option} onGesture={() => {}} theme={scheme} />;
}
