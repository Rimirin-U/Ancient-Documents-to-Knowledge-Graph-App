import { ThemedView } from "@/components/themed-view";
import { Button } from '@/components/ui/button';
import { MediaAsset, MediaPicker } from '@/components/ui/media-picker';
import { useToast } from '@/components/ui/toast';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet } from "react-native";
import { uploadImage as uploadImageService } from "@/services/analysis";

/** 上传前压缩图片，目标宽度 1920px、JPEG 质量 0.82，减少上传流量 */
async function compressImage(uri: string): Promise<string> {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 1920 } }],
      { compress: 0.82, format: SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    // 压缩失败时使用原图，不影响上传流程
    return uri;
  }
}

export default function Index() {
  const toast = useToast();

  const uploadImage = async (uri: string, fileName: string) => {
    try {
      const compressedUri = await compressImage(uri);
      const jpgFileName = fileName.replace(/\.[^.]+$/, '') + '.jpg';
      await uploadImageService(compressedUri, jpgFileName);
      toast.success('上传成功', '上传成功，后台分析中');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : '请重试';
      toast.error('上传失败', message);
    }
  };

  const handleMediaSelected = async (assets: MediaAsset[]) => {
    const asset = assets[assets.length - 1];
    if (!asset) return;
    const fileName = asset.filename || `image_${Date.now()}.jpg`;
    await uploadImage(asset.uri, fileName);
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast.warning('权限不足', '请先授予相机权限');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
      await uploadImage(asset.uri, fileName);
    } catch (error) {
      const message = error instanceof Error ? error.message : '拍摄失败，请重试';
      toast.error('拍摄失败', message);
    }
  };

  // PAGE
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.row}>
        <MediaPicker
          mediaType="image"
          multiple={false}
          showPreview={false}
          buttonText="选择图片"
          onSelectionChange={handleMediaSelected}
        />

        <Button variant="secondary" onPress={handleTakePhoto}>
          拍摄图片
        </Button>
      </ThemedView>
    </ThemedView>
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
    width: '80%',
    gap: 16,
  },
});