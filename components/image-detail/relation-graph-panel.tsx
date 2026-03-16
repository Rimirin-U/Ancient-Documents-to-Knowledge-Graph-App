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

function toGraphContent(content: unknown): GraphContent | null {
  if (!content || typeof content !== 'object') return null;

  const candidate = content as Record<string, unknown>;
  
  let nodes: any[] = [];
  let links: any[] = [];
  let categoriesSource: any[] = [];

  // 兼容 - 直接结构{nodes, links, categories}
  if (Array.isArray(candidate.nodes)) {
    nodes = candidate.nodes;
    links = Array.isArray(candidate.links) ? candidate.links : [];
    categoriesSource = Array.isArray(candidate.categories) ? candidate.categories : [];
  } 
  // 标准结构 - ECharts 格式
  else if (Array.isArray(candidate.series) && candidate.series.length > 0) {
    const graphSeries = (candidate.series as any[]).find((s) => s.type === 'graph');
    if (graphSeries) {
      nodes = Array.isArray(graphSeries.data) ? graphSeries.data : [];
      links = Array.isArray(graphSeries.links) ? graphSeries.links : [];
      categoriesSource = Array.isArray(graphSeries.categories) ? graphSeries.categories : [];
    }
  }

  if (!nodes.length) return null;

  const categories =
    categoriesSource.length > 0
      ? (categoriesSource as { name: string }[])
      : Array.from(new Set(nodes.map((node) => String((node as any).category ?? '实体')))).map((name) => ({ name }));

  return {
    nodes: nodes as GraphContent['nodes'],
    links: links as GraphContent['links'],
    categories,
  };
}

export function RelationGraphPanel({ content }: RelationGraphPanelProps) {
  const scheme = useColorScheme() ?? 'light';
  const graphContent = toGraphContent(content);

  if (!graphContent) {
    return <ThemedText>暂无可渲染关系图，点击下方按钮可重新生成</ThemedText>;
  }

  const option = {
    tooltip: { trigger: 'item' },
    legend: {
      data: graphContent.categories.map((item) => item.name),
      bottom: 10,
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: graphContent.nodes,
        links: graphContent.links,
        categories: graphContent.categories,
        roam: true,
        label: { show: true, position: 'top' },
        lineStyle: { color: 'source', curveness: 0.12, width: 1.6 },
        force: {
          repulsion: 220,
          edgeLength: 100,
        },
      },
    ],
  };

  return <Chart option={option} onGesture={() => {}} theme={scheme} />;
}
