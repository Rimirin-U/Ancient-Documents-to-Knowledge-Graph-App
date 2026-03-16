import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { ThemedText } from '@/components/themed-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Card } from '@/components/ui/card';
import { FileText, Eye } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export type CrossDocImageDetailInfo = {
  id: number;
  title: string;
  filename: string;
  uploadTime: string;
  imageDataUrl?: string;
};

type ImageInfoSheetProps = {
  visible: boolean;
  imageInfo: CrossDocImageDetailInfo | null;
  onClose: () => void;
  onPressDetail?: (imageInfo: CrossDocImageDetailInfo & { imageDataUrl?: string }) => void;
  onPressDownload?: (imageInfo: CrossDocImageDetailInfo & { imageDataUrl?: string }) => void;
};

export function ImageInfoSheet({
  visible,
  imageInfo,
  onClose,
  onPressDetail,
  onPressDownload,
}: ImageInfoSheetProps) {
  return (
    <BottomSheet isVisible={visible} onClose={onClose} snapPoints={[0.7]}>
      {imageInfo ? (
        <View style={styles.container}>
          {imageInfo.imageDataUrl ? (
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: imageInfo.imageDataUrl }}
                contentFit="cover"
                variant="default"
                style={styles.image}
              />
            </View>
          ) : null}

          <Card style={styles.infoCard}>
            <View style={styles.row}>
              <ThemedText style={styles.label}>标题</ThemedText>
              <ThemedText style={styles.value}>{imageInfo.title || '-'}</ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText style={styles.label}>文件名</ThemedText>
              <ThemedText style={styles.value}>{imageInfo.filename || '-'}</ThemedText>
            </View>
            <View style={[styles.row, styles.lastRow]}>
              <ThemedText style={styles.label}>上传时间</ThemedText>
              <ThemedText style={styles.value}>{imageInfo.uploadTime || '-'}</ThemedText>
            </View>
          </Card>

          <View style={styles.actions}>
            <Button
              variant="default"
              icon={Eye}
              onPress={() => onPressDetail?.(imageInfo)}
              style={styles.actionButton}
              textStyle={styles.buttonText}
            >详情</Button>
            <Button
              variant="outline"
              icon={FileText}
              onPress={() => onPressDownload?.(imageInfo)}
              style={styles.actionButton}
              textStyle={styles.buttonText}
            >保存</Button>
          </View>
        </View>
      ) : (
        <ThemedText>暂无图片详细信息</ThemedText>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  imageWrap: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cfd6e4',
    gap: 6,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 13,
    opacity: 0.75,
  },
  value: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
  },
});
