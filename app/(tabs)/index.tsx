import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { Pressable } from "react-native";
import * as ImagePicker from 'expo-image-picker'

import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { SFSymbols7_0 } from "sf-symbols-typescript";


export default function Index() {
  const router = useRouter();
  const color = useThemeColor({ light: "black", dark: "white" }, 'text');

  // 传递图片
  const goDetail = (uri: string) => {
    router.push({
      pathname: "/detail",
      params: { imageUri: uri },
    });
  };

  // 选择图片
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });
    // log
    console.log(result);
    // after
    if (!result.canceled) {
      goDetail(result.assets[0].uri);
    }
  };

  // 拍摄图片
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      goDetail(result.assets[0].uri);
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