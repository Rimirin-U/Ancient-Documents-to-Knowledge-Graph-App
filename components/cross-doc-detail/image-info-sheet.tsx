import { ThemedText } from '@/components/themed-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Card } from '@/components/ui/card';
import { StyleSheet, View } from 'react-native';

export type CrossDocImageDetailInfo = {
  id: number;
  title: string;
  filename: string;
  uploadTime: string;
};

type ImageInfoSheetProps = {
  visible: boolean;
  imageInfo: CrossDocImageDetailInfo | null;
  onClose: () => void;
};

export function ImageInfoSheet({ visible, imageInfo, onClose }: ImageInfoSheetProps) {
  return (
    <BottomSheet isVisible={visible} onClose={onClose} title="图片详细信息" snapPoints={[0.38, 0.55]}>
      {imageInfo ? (
        <Card style={styles.card}>
          <View style={styles.row}>
            <ThemedText style={styles.label}>ID</ThemedText>
            <ThemedText style={styles.value}>{String(imageInfo.id)}</ThemedText>
          </View>
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
      ) : (
        <ThemedText>暂无图片详细信息</ThemedText>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  card: {
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
});
