import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const E_HEIGHT = 350;

// HTML(EChart)
const getChartHtml = (option: any) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
      body, html, #main { 
        height: 100%; 
        width: 100%; 
        margin: 0; 
        padding: 0; 
        overflow: hidden; 
        background-color: white;
      }
    </style>
    <script src="https://fastly.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  </head>
  <body>
    <div id="main"></div>
    <script>
      var myChart = echarts.init(document.getElementById('main'));
      // 接收来自 React Native 的 Option
      function setChartOption(option) {
        myChart.setOption(option);
      }
      
      // 初始化
      setChartOption(${JSON.stringify(option)});

      // 响应窗口大小变化
      window.addEventListener('resize', function() {
        myChart.resize();
      });

      myChart.on('click', function(params) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'click',
          data: params.name
        }));
      });

      // 禁用ScrollView
      var container = document.getElementById('main');
      // 禁用
      container.addEventListener('touchstart', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'gesture', active: true }));
      }, { passive: true });
      // 恢复
      function endGesture() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'gesture', active: false }));
      }
      container.addEventListener('touchend', endGesture);
      container.addEventListener('touchcancel', endGesture);
    </script>
  </body>
</html>
`;

// EChart(WebView)
function WebViewChart({ option, onGesture }: { option: any, onGesture: (isBusy: boolean) => void }) {
  const webViewRef = useRef<WebView>(null);

  // on option change
  useEffect(() => {
    const script = `setChartOption(${JSON.stringify(option)})`;
    webViewRef.current?.injectJavaScript(script);
  }, [option]);

  return (
    <View style={ styles.webview }>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: getChartHtml(option) }}
        style={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event) => {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'gesture') {
            onGesture(data.active); // 禁用ScrollView
          }
        }}
      />
    </View>
  );
}

export default function Detail() {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
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
        <WebViewChart option={option} onGesture={(active: any) => setScrollEnabled(!active)} />
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
  webview: {
    width: SCREEN_WIDTH - 32,
    height: E_HEIGHT,
    borderRadius: 16,        // 设置圆角半径
    overflow: 'hidden',     // 强制裁剪超出部分的 WebView 内容
  },
});