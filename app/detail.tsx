import { Chart } from "@/components/echarts/echarts";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Pressable, ScrollView, StyleSheet, useColorScheme } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Detail() {
  const { analysisId, imageUri } = useLocalSearchParams<{ analysisId?: string; imageUri?: string }>();
  const colorScheme = useColorScheme();
  const [imageHeight, setImageHeight] = useState<number>(1);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!analysisId || !imageUri) {
    return <ThemedText>错误 - 缺少参数</ThemedText>;
  }

  // 获取分析数据
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://192.168.3.41:3000/api/analysis/${analysisId}`);
      if (!response.ok) {
        throw new Error('获取数据失败');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [analysisId]);

  const retry = () => {
    Alert.alert('重试', '重新加载数据？', [
      { text: '取消' },
      { text: '确定', onPress: fetchData }
    ]);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" />
        <ThemedText>分析中...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.error}>
        <ThemedText>错误: {error}</ThemedText>
        <Pressable onPress={retry}>
          <ThemedText>重试</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const { nodes, links, categories, txt } = data;

  const option = {
    title: {
      subtext: `节点: ${nodes.length} / 关系: ${links.length}`,
      left: 'right',
    },
    tooltip: { trigger: 'item' },
    legend: {
      data: categories.map((cat: any) => cat.name),
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
        <ThemedText>{ txt }</ThemedText>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});