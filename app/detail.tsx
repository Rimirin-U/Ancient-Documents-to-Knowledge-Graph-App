import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";

// ECharts
import { SvgChart, SVGRenderer } from '@wuba/react-native-echarts';
import {
  GraphChart
} from 'echarts/charts';
import {
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';

echarts.use([
  GraphChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  SVGRenderer,
]);


const { width: SCREEN_WIDTH } = Dimensions.get("window");
const E_HEIGHT = 250;

// ECharts initialize
function ChartComponent({ option }) {
  const chartRef = useRef<any>(null); // component
  useEffect(() => {
    let chart: any;
    if (chartRef.current) {
      chart = echarts.init(chartRef.current, 'light', {
        renderer: 'svg',
        width: SCREEN_WIDTH,
        height: E_HEIGHT,
      });
      chart.setOption(option);
    }
    return () => chart?.dispose();
  }, [option]);
  return (
    <SvgChart 
      ref={chartRef}
      style={{ width: SCREEN_WIDTH, height: E_HEIGHT }}
    />);
}

// page
export default function Detail() {
  const { imageUri } = useLocalSearchParams<{
    imageUri?: string;
  }>();
  const [imageHeight, setImageHeight] = useState<number>(1);
  if (!imageUri) {
    return <ThemedText>错误 - 无图片</ThemedText>;
  }

  // 测试用数据
  /*
  const nodes = []; // ...
  const links = []; // ...
  const categories = []; // ...
  */
  const nodes = [{"id": "file2_node0", "name": "劉永濟", "type": "person", "category": "立約人", "symbolSize": 40, "itemStyle": {"color": "#5470c6", "borderColor": "#fff", "borderWidth": 2, "shadowBlur": 10, "shadowColor": "rgba(0, 0, 0, 0.3)"}}, {"id": "file2_node1", "name": "白田四形", "type": "object", "category": "标的", "symbolSize": 35, "itemStyle": {"color": "#91cc75", "borderColor": "#fff", "borderWidth": 2, "shadowBlur": 10, "shadowColor": "rgba(0, 0, 0, 0.3)"}}];
  const links = [{"source": "file2_node0", "target": "file2_node1", "value": "出让", "lineStyle": {"color": "#ff0000", "width": 2}}];
  const categories = [{"name": "立約人"}, {"name": "标的"}];
  const option = {
    title: {
        text: '图谱',
        subtext: `共 ${nodes.length} 个节点, ${links.length} 条关系`,
        left: 'center',
        top: 10,
        textStyle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#2c3e50'
        },
        subtextStyle: {
            fontSize: 14,
            color: '#7f8c8d'
        }
    },
    tooltip: {
        trigger: 'item',
        formatter: function(params) {
            if (params.dataType === 'node') {
                return `<b>${params.data.name}</b><br/>` +
                        `类型: ${params.data.type || '未知'}<br/>` +
                        `角色: ${params.data.category || '未知'}`;
            } else if (params.dataType === 'edge') {
                return `关系: ${params.data.value || '未知'}`;
            }
        }
    },
    legend: {
        data: categories.map(cat => cat.name),
        orient: 'vertical',
        right: 10,
        top: 60,
        textStyle: {
            fontSize: 12
        }
    },
    series: [{
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        categories: categories,
        force: {
            repulsion: 200,
            gravity: 0.1,
            edgeLength: 150,
            layoutAnimation: true
        },
        roam: true,
        draggable: true,
        focusNodeAdjacency: true,
        symbolSize: 40,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [4, 10],
        label: {
            show: true,
            position: 'right',
            fontSize: 14,
            fontWeight: 'bold',
            color: '#2c3e50'
        },
        edgeLabel: {
            show: true,
            fontSize: 12,
            formatter: '{c}'
        },
        lineStyle: {
            color: 'source',
            curveness: 0.3,
            width: 2,
            opacity: 0.8
        },
        emphasis: {
            focus: 'adjacency',
            lineStyle: {
                width: 4
            }
        }
    }]
  };
        

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
    >
      {/* 图片 */}
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.image,
          imageHeight ? {height: imageHeight} : undefined,
        ]}
        contentFit="contain"
        onLoad={(event)=>{
          const { width, height } = event.source;
          const scale = SCREEN_WIDTH / width;
          setImageHeight(height * scale);
        }}
      />

      {/* 文本 */}
      <ThemedView style={styles.textSection}>
        <Collapsible title="识别结果" initial_open={true}>
          <ThemedText>
            OCR识别得到的文本内容
            {"\n"}
          </ThemedText>
        </Collapsible>
      </ThemedView>

      {/* 图谱 */}
      <ThemedView style={styles.chartSection}>
        <Collapsible title="图谱" initial_open={true}>
          <ChartComponent option={option} />
        </Collapsible>
      </ThemedView>
    </ScrollView>
  );
}

// style
const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },

  image: {
    width: SCREEN_WIDTH,
    backgroundColor: "transparent",
  },

  textSection: {
    padding: 16,
  },

  chartSection: {
    padding: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  chartPlaceholder: {
    height: 260,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "gray",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
  },
});
