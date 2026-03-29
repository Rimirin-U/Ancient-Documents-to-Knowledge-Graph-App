import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Image } from '@/components/ui/image';
import { useColor } from '@/hooks/useColor';
import { getToken } from '@/services/api';
import { CrossDocRecordItem, getThumbnailUrl } from '@/services/record';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ImageSource } from 'expo-image';
import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

function StackedPreviewThumb({
  imageId,
  recyclingKey,
}: {
  imageId: number;
  recyclingKey: string;
}) {
  const [source, setSource] = useState<ImageSource | undefined>();

  useEffect(() => {
    let cancelled = false;
    getToken().then((token) => {
      if (cancelled) return;
      setSource({
        uri: getThumbnailUrl(imageId),
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    });
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  if (!source) {
    return <View style={styles.image} />;
  }

  return (
    <Image
      source={source}
      recyclingKey={recyclingKey}
      contentFit="cover"
      variant="default"
      style={styles.image}
    />
  );
}

type CrossDocCardProps = {
  item: CrossDocRecordItem;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onPress?: (item: CrossDocRecordItem) => void;
};

function CrossDocCardBase({
  item,
  selectable,
  selected,
  onToggleSelect,
  onPress,
}: CrossDocCardProps) {
  const cardBg = useColor('background', { light: '#f7f7f8', dark: '#1f2226' });
  const muted = useColor('icon', { light: '#5f6368', dark: '#a9b1ba' });
  const outline = useColor('icon', { light: '#d9dce1', dark: '#383d44' });
  const checkboxBg = useColor('background', { light: '#ffffff', dark: '#0f1115' });
  const thumbnailBg = useColor('screen');
  const checkTint = useColor('tint');

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

  const previewIds = item.previewImageIds.slice(0, 3);

  return (
    <Pressable onPress={handlePress}>
      <Card style={[styles.container, { backgroundColor: cardBg }]}>
        {selectable ? (
          <Pressable hitSlop={8} onPress={() => onToggleSelect(item.id)} style={styles.checkboxWrap}>
            <View style={[styles.checkbox, { borderColor: outline, backgroundColor: checkboxBg }]}>
              {selected ? <MaterialIcons name="check" size={16} color={checkTint} /> : null}
            </View>
          </Pressable>
        ) : null}

        <View style={styles.stackWrap}>
          {previewIds.length ? (
            previewIds.map((imageId, index) => (
              <View
                key={`${item.id}-${imageId}`}
                style={[
                  styles.stackItem,
                  {
                    borderColor: outline,
                    backgroundColor: thumbnailBg,
                    left: index * 12,
                    zIndex: previewIds.length - index,
                  },
                ]}
              >
                <StackedPreviewThumb
                  imageId={imageId}
                  recyclingKey={`cross-doc-${item.id}-p${imageId}`}
                />
              </View>
            ))
          ) : (
            <View style={[styles.stackItem, styles.singleFallback, { borderColor: outline, backgroundColor: thumbnailBg }]}>
              <MaterialIcons name="collections" size={34} color={muted} />
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

export const CrossDocCard = memo(CrossDocCardBase);

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
  },
  stackWrap: {
    width: 120,
    height: 96,
    position: 'relative',
  },
  stackItem: {
    width: 84,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'absolute',
    top: 0,
  },
  singleFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    left: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    lineHeight: 21,
  },
  fileName: {
    fontSize: 14,
    lineHeight: 18,
  },
  time: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 18,
  },
});
