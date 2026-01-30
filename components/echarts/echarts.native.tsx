import React, { useEffect, useRef } from "react";
import { Dimensions, View } from "react-native";
import { WebView } from "react-native-webview";
import { getChartHtml } from "./echartsHtml";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const E_HEIGHT = 350;

export function Chart({ option, onGesture, theme }: 
  { option: any, onGesture: (isBusy: boolean) => void, theme: 'light'|'dark' }) {
  const webViewRef = useRef<WebView>(null);

  console.log("native");

  // on option change
  useEffect(() => {
    const script = `setChartOption(${JSON.stringify(option)}, '${theme}')`;
    webViewRef.current?.injectJavaScript(script);
  }, [option, theme]);

  return (
    <View style={{
      width: SCREEN_WIDTH - 32,
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