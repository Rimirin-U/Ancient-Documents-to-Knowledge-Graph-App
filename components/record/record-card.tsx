import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Image } from '@/components/ui/image';
import { useColor } from '@/hooks/useColor';
import { getToken } from '@/services/api';
import { RecordImageItem, getThumbnailUrl } from '@/services/record';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ImageSource } from 'expo-image';
import { memo, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

type RecordCardProps = {
  item: RecordImageItem;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onPress?: (item: RecordImageItem) => void;
};

function RecordCardBase({
  item,
  selectable,
  selected,
  onToggleSelect,
  onPress,
}: RecordCardProps) {
  const cardBg = useColor('background', { light: '#f7f7f8', dark: '#1f2226' });
  const muted = useColor('icon', { light: '#5f6368', dark: '#a9b1ba' });
  const outline = useColor('icon', { light: '#d9dce1', dark: '#383d44' });
  const checkboxBg = useColor('background', { light: '#ffffff', dark: '#0f1115' });
  const thumbnailBg = useColor('screen');
  const checkTint = useColor('tint');

  const [imageFailed, setImageFailed] = useState(false);
  const [imageSource, setImageSource] = useState<ImageSource | undefined>();

  useEffect(() => {
    let cancelled = false;
    getToken().then((token) => {
      if (cancelled) return;
      setImageSource({
        uri: getThumbnailUrl(item.id),
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    });
    return () => { cancelled = true; };
  }, [item.id]);

  const uploadText = useMemo(() => {
    const date = new Date(item.uploadTime);
    if (Number.isNaN(date.getTime())) return item.uploadTime;
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [item.uploadTime]);

  function handlePress() {
    if (selectable) {
      onToggleSelect(item.id);
      return;
    }
    onPress?.(item);
  }

  return (
    <Pressable onPress={handlePress}>
      <Card style={[styles.container, { backgroundColor: cardBg }]}>
        {selectable ? (
          <Pressable
            hitSlop={8}
            onPress={() => onToggleSelect(item.id)}
            style={styles.checkboxWrap}
          >
            <View style={[styles.checkbox, { borderColor: outline, backgroundColor: checkboxBg }]}>
              {selected ? (
                <MaterialIcons name="check" size={16} color={checkTint} />
              ) : null}
            </View>
          </Pressable>
        ) : null}

        <View style={[styles.thumbnail, { borderColor: outline, backgroundColor: thumbnailBg }]}> 
          {!imageFailed && imageSource ? (
            <Image
              source={imageSource}
              recyclingKey={`record-thumb-${item.id}`}
              contentFit="cover"
              variant="default"
              style={styles.image}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={styles.fallback}>
              <ThemedText>缩略图</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText style={[styles.fileName, { color: muted }]} numberOfLines={1}>
            {item.filename}
          </ThemedText>
          <ThemedText style={[styles.time, { color: muted }]}>{uploadText}</ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

export const RecordCard = memo(RecordCardBase);

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    gap: 10,
  },
  checkboxWrap: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  thumbnail: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#eceef1',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 28 / 2,
    lineHeight: 20,
  },
  fileName: {
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
  },
});
