import React, { useEffect, useRef } from "react";
import { Dimensions, View } from "react-native";
import { WebView } from "react-native-webview";
import { getChartHtml } from "./echartsHtml";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const E_HEIGHT = 480;

export type NodeClickData = {
  name: string;
  category: number | null;
  properties: Record<string, unknown> | null;
};

export function Chart({
  option,
  onGesture,
  theme,
  onNodeClick,
}: {
  option: any;
  onGesture: (isBusy: boolean) => void;
  theme: 'light' | 'dark';
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
      height: E_HEIGHT,
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
                name: data.name,
                category: data.category,
                properties: data.properties,
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