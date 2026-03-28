import React, { useEffect, useRef } from "react";
import { Dimensions, View } from "react-native";
import { WebView } from "react-native-webview";
import { getChartHtml } from "./echartsHtml";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const E_HEIGHT = 480;

/** 与 echartsHtml 内 nodeClick 载荷、Web 端 echarts.tsx 保持一致 */
export type NodeClickData = {
  name: string;
  category: number | null;
  symbolSize: number | null;
  properties: unknown;
  seriesType: string | null;
};

export function Chart({
  option,
  onGesture,
  theme,
  height = 480,
  onNodeClick,
}: {
  option: any;
  onGesture: (isBusy: boolean) => void;
  theme: 'light' | 'dark';
  height?: number;
  onNodeClick?: (node: NodeClickData) => void;
}) {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const normalizedOption = { ...option };
    if (Array.isArray(normalizedOption.legend)) {
      normalizedOption.legend = normalizedOption.legend[0] || {};
    }

    const script = `setChartOption(${JSON.stringify(normalizedOption)}, '${theme}')`;
    webViewRef.current?.injectJavaScript(script);
  }, [option, theme]);

  return (
    <View style={{
      height: height,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme === 'dark' ? 'black' : 'white',
      borderColor: 'gray',
      borderStyle: 'dashed',
      borderWidth: 1,
    }}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: getChartHtml(option, theme) }}
        style={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'gesture') {
              onGesture(data.active);
            } else if (data.type === 'nodeClick' && onNodeClick) {
              onNodeClick({
                name: String(data.name ?? ''),
                category:
                  data.category === undefined || data.category === null
                    ? null
                    : Number(data.category),
                symbolSize:
                  data.symbolSize === undefined || data.symbolSize === null
                    ? null
                    : Number(data.symbolSize),
                properties: data.properties ?? null,
                seriesType: data.seriesType != null ? String(data.seriesType) : null,
              });
            }
          } catch {
            // 解析失败时静默忽略
          }
        }}
      />
    </View>
  );
}