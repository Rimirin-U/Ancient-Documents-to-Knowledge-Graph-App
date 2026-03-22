import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { MediaAsset, MediaPicker } from '@/components/ui/media-picker';
import { useToast } from '@/components/ui/toast';
import { useColor } from '@/hooks/useColor';
import { uploadImage as uploadImageService } from '@/services/analysis';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CompressResult = { uri: string; compressed: boolean };

async function compressImage(uri: string): Promise<CompressResult> {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 1920 } }],
      { compress: 0.82, format: SaveFormat.JPEG },
    );
    return { uri: result.uri, compressed: true };
  } catch {
    return { uri, compressed: false };
  }
}

const STEPS = [
  { icon: 'add-photo-alternate' as const, title: '上传', desc: '拍照或从相册选择地契、文书图片' },
  { icon: 'auto-awesome' as const, title: '自动识别', desc: '后台 OCR 与结构化，生成知识图谱' },
  { icon: 'forum' as const, title: '问答与统计', desc: '在「问答」里提问，在「统计」里看趋势' },
];

export default function Index() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const accentBg = useColor('accent');
  const accentBorder = useColor('border');
  const muted = useColor('mutedForeground');
  const primary = useColor('primary');
  const heroIconBg = useColor('secondary');

  const uploadImage = async (uri: string, fileName: string) => {
    try {
      const { uri: compressedUri, compressed } = await compressImage(uri);
      const uploadFileName = compressed ? fileName.replace(/\.[^.]+$/, '') + '.jpg' : fileName;
      await uploadImageService(compressedUri, uploadFileName);
      toast.success('上传成功', '正在后台分析，可在「记录」中查看进度');
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
        mediaTypes: ['images'],
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

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Math.max(insets.top, 20), paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: accentBg, borderColor: accentBorder }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: heroIconBg }]}>
            <MaterialIcons name="menu-book" size={36} color={primary} />
          </View>
          <ThemedText type="title" style={styles.heroTitle}>
            文书识别助手
          </ThemedText>
          <ThemedText style={[styles.heroSubtitle, { color: muted }]}>
            上传古籍、地契照片，自动提取信息并支持智能问答
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <MediaPicker
            mediaType="image"
            multiple={false}
            showPreview={false}
            buttonText="从相册选择图片"
            variant="default"
            size="lg"
            style={styles.fullWidth}
            onSelectionChange={handleMediaSelected}
          />
          <Button variant="secondary" size="lg" onPress={handleTakePhoto} style={styles.fullWidth}>
            <View style={styles.rowCenter}>
              <MaterialIcons name="photo-camera" size={22} color={primary} />
              <ThemedText type="defaultSemiBold" style={{ color: primary }}>
                拍摄照片上传
              </ThemedText>
            </View>
          </Button>
        </View>

        <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
          使用步骤
        </ThemedText>
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View
              key={s.title}
              style={[styles.stepRow, { borderColor: accentBorder, backgroundColor: accentBg }]}>
              <View style={[styles.stepBadge, { backgroundColor: primary }]}>
                <ThemedText style={styles.stepNum}>{i + 1}</ThemedText>
              </View>
              <MaterialIcons name={s.icon} size={28} color={primary} style={styles.stepIcon} />
              <View style={styles.stepText}>
                <ThemedText type="defaultSemiBold">{s.title}</ThemedText>
                <ThemedText style={[styles.stepDesc, { color: muted }]}>{s.desc}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <ThemedText style={[styles.hint, { color: muted }]}>
          提示：上传后无需停留本页，可在底部「记录」查看识别状态。
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 10,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  actions: {
    gap: 12,
  },
  fullWidth: {
    width: '100%',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  steps: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepIcon: {
    marginLeft: -4,
  },
  stepText: {
    flex: 1,
    gap: 4,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  hint: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
  },
});
