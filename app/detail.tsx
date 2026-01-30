import { Chart } from "@/components/echarts/echarts";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, useColorScheme } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Detail() {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const colorScheme = useColorScheme();
  const [imageHeight, setImageHeight] = useState<number>(1);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  if (!imageUri) {
    return <ThemedText>错误 - 无图片</ThemedText>;
  }

  // 测试数据
  const nodes = [
    { id: "file2_node0", name: "劉永濟", type: "person", category: "立約人", symbolSize: 40 },
    { id: "file2_node1", name: "白田四形", type: "object", category: "标的", symbolSize: 35 }
  ];
  const links = [
    { source: "file2_node0", target: "file2_node1", value: "出让" }
  ];
  const categories = [{ name: "立約人" }, { name: "标的" }];

  const option = {
    title: {
      subtext: `节点: ${nodes.length} / 关系: ${links.length}`,
      left: 'right',
    },
    tooltip: { trigger: 'item' },
    legend: {
      data: categories.map(cat => cat.name),
      bottom: 10,
    },
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes,
      links: links,
      categories: categories,
      force: {
        repulsion: 300,
        edgeLength: 120,
      },
      roam: true,
      label: { show: true, position: 'top' },
      edgeLabel: { show: true, formatter: '{c}' },
      lineStyle: { color: 'source', curveness: 0.2, width: 2 },
    }],
    force: {
      repulsion: 150,      // 斥力
      gravity: 0.2,        // 引力
      edgeLength: 200,     // 边长
      friction: 0.4,       // 摩擦力
      layoutAnimation: true
    },
  };

  // page
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      scrollEnabled={scrollEnabled}
      >
      <Image
        source={{ uri: imageUri }}
        style={[styles.image, { height: imageHeight }]}
        contentFit="contain"
        onLoad={(event) => {
          const { width, height } = event.source;
          setImageHeight(height * (SCREEN_WIDTH / width));
        }}
      />

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.head}>识别结果</ThemedText>
        <ThemedText>OCR 识别得到的文本内容</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.head}>图谱</ThemedText>
        <Chart
          option={option}
          onGesture={(active: any) => setScrollEnabled(!active)} 
          theme={colorScheme ?? 'light'}/>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  image: { width: SCREEN_WIDTH },
  section: { padding: 16 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical:12
  },
});