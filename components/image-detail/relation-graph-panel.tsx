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

  // 兼容直接结构 {nodes, links, categories}
  if (Array.isArray(candidate.nodes)) {
    nodes = candidate.nodes;
    links = Array.isArray(candidate.links) ? candidate.links : [];
    categoriesSource = Array.isArray(candidate.categories) ? candidate.categories : [];
  }
  // ECharts series 格式 {series: [{type: 'graph', data, links, categories}]}
  else if (Array.isArray(candidate.series) && candidate.series.length > 0) {
    const graphSeries = (candidate.series as any[]).find((s) => s.type === 'graph');
    if (graphSeries) {
      nodes = Array.isArray(graphSeries.data) ? graphSeries.data : [];
      links = Array.isArray(graphSeries.links) ? graphSeries.links : [];
      categoriesSource = Array.isArray(graphSeries.categories) ? graphSeries.categories : [];
    }
  }

  if (!nodes.length) return null;

  // 构建 id→name 映射，修复后端使用 id 字段作为连线 source/target 的问题
  const idToName: Record<string, string> = {};
  for (const node of nodes) {
    const nodeId = node.id !== undefined ? String(node.id) : null;
    const nodeName = node.name !== undefined ? String(node.name) : null;
    if (nodeId && nodeName) idToName[nodeId] = nodeName;
  }

  // 将连线的 source/target 从 id 映射到 name（ECharts 按 name 匹配节点）
  const fixedLinks = links.map((link: any) => {
    const src = String(link.source ?? '');
    const tgt = String(link.target ?? '');
    return {
      ...link,
      source: idToName[src] ?? src,
      target: idToName[tgt] ?? tgt,
    };
  });

  // 翻译旧数据的英文分类名；新数据已是中文，直接透传
  const categories =
    categoriesSource.length > 0
      ? categoriesSource.map((c: { name: string }) => ({
          name: CATEGORY_NAME_ZH[c.name] ?? c.name,
        }))
      : Array.from(
          new Set(nodes.map((node) => String((node as any).category ?? '实体')))
        ).map((name) => ({ name }));

  // 规范化节点：保留所有后端设置的 label/symbol/itemStyle 等属性，仅补全缺省值
  const fixedNodes = nodes.map((node: any) => ({
    ...node,
    name: node.name !== undefined ? String(node.name) : String(node.id ?? ''),
    symbolSize: node.symbolSize ?? 30,
  }));

  return {
    nodes: fixedNodes,
    links: fixedLinks,
    categories,
  };
}

export function RelationGraphPanel({ content }: RelationGraphPanelProps) {
  const scheme = useColorScheme() ?? 'light';
  const graphContent = toGraphContent(content);

  if (!graphContent) {
    return <ThemedText>暂无可渲染关系图，点击下方按钮可重新生成</ThemedText>;
  }

  // 注意：ECharts 图表通过 iframe/WebView 以 JSON 传参，
  // formatter 必须使用字符串模板，JS 函数会被 JSON.stringify 丢弃。
  // 边标签通过各连线自身的 label.formatter 字符串控制（后端已设置）。
  const option = {
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: '{b}',
    },
    legend: {
      data: graphContent.categories.map((item) => item.name),
      bottom: 4,
      textStyle: { fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: graphContent.nodes,
        links: graphContent.links,
        categories: graphContent.categories,
        roam: true,
        // 系列默认标签（节点自身 label 会覆盖此处）
        label: {
          show: true,
          position: 'bottom',
          fontSize: 12,
        },
        // 边标签默认隐藏；各连线通过自身 label.show/formatter 控制
        edgeLabel: {
          show: false,
          fontSize: 11,
          backgroundColor: 'rgba(255,255,255,0.75)',
          borderRadius: 3,
          padding: [2, 5],
        },
        lineStyle: {
          color: 'source',
          curveness: 0.15,
          width: 2,
        },
        // 以契约节点为中心的辐射拓扑：增大斥力 + 适度重力
        force: {
          repulsion: 420,
          edgeLength: [90, 180],
          gravity: 0.12,
          layoutAnimation: true,
          friction: 0.6,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3.5 },
          label: { show: true },
        },
      },
    ],
  };

  return <Chart option={option} onGesture={() => {}} theme={scheme} />;
}
