import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import * as ImagePicker from 'expo-image-picker';
import { Pressable } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useRouter } from "expo-router";
import { Alert, StyleSheet } from "react-native";
import { uploadImage as uploadImageService } from "@/services/analysis";
import { SFSymbols7_0 } from "sf-symbols-typescript";


export default function Index() {
  const router = useRouter();
  const color = useThemeColor({ light: "black", dark: "white" }, 'text');

  // 传递分析ID
  const goDetail = (analysisId: string, imageUri: string) => {
    router.push({
      pathname: "/detail",
      params: { analysisId, imageUri },
    });
  };

  // 上传图片
  const uploadImage = async (uri: string, fileName: string) => {
    console.log("LOG uri:", uri);
    try {
      const result = await uploadImageService(uri, fileName);
      goDetail(result.analysisId, uri);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : '请重试';
      Alert.alert('上传失败', message);
    }
  };

  // 选择图片
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    // log
    console.log(result);
    // after
    if (!result.canceled) {
      const asset = result.assets[0];
      const fileName = asset.fileName || `image_${Date.now()}.jpg`;
      await uploadImage(asset.uri, fileName);
    }
  };

  // 拍摄图片
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });
    // log
    console.log(result);
    // after
    if (!result.canceled) {
      const asset = result.assets[0];
      const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
      await uploadImage(asset.uri, fileName);
    }
  };

  // PAGE
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.row}>
        {/* 相册 */}
        <ActionButton
          icon="photo.fill"
          text="选择图片"
          color={color}
          onPress={pickImage}
        />

        {/* 相机 */}
        <ActionButton
          icon="camera.fill"
          text="拍摄图片"
          color={color}
          onPress={takePhoto}
        />
      </ThemedView>
    </ThemedView>
  );
}

// ActionButton
function ActionButton({
  icon,
  text,
  color,
  onPress,
}: {
  icon: SFSymbols7_0;
  text: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <IconSymbol size={32} name={icon} color={color} />
      <ThemedText style={styles.buttonText}>{text}</ThemedText>
    </Pressable>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: 32,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
  },
});