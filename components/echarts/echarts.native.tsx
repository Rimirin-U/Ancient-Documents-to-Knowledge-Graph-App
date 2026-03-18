import React, { useEffect, useRef } from "react";
import { Dimensions, View } from "react-native";
import { WebView } from "react-native-webview";
import { getChartHtml } from "./echartsHtml";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const E_HEIGHT = 400;

export function Chart({ option, onGesture, theme }: 
  { option: any, onGesture: (isBusy: boolean) => void, theme: 'light'|'dark' }) {
  const webViewRef = useRef<WebView>(null);

  // on option change
  useEffect(() => {
    // legend 若为数组取第一项（ECharts 接受对象形式）
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
      borderWidth: 1}}
    >
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: getChartHtml(option, theme) }}
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