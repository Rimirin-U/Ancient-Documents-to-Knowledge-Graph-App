import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";

import { ScrollView, StyleSheet, Dimensions, View } from "react-native";
import { useState } from "react";
import { Collapsible } from "@/components/ui/collapsible";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Detail() {
  const { imageUri } = useLocalSearchParams<{
    imageUri?: string;
  }>();
  const [imageHeight, setImageHeight] = useState<number>(1);
  if (!imageUri) {
    return <ThemedText>错误 - 无图片</ThemedText>;
  }

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
          <ThemedView style={styles.chartPlaceholder}>
            <ThemedText>
              ECharts
            </ThemedText>
          </ThemedView>
        </Collapsible>
      </ThemedView>
    </ScrollView>
  );
}

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
