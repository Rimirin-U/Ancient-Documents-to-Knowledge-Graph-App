import { CrossDocImageDetailInfo } from '@/components/cross-doc-detail/image-info-sheet';
import { AnalysisSectionCard } from '@/components/image-detail/analysis-section-card';
import { Image } from '@/components/ui/image';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { getToken } from '@/services/api';
import { getThumbnailUrl } from '@/services/record';
import { ImageSource } from 'expo-image';
import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

export type CrossDocImageGalleryItem = CrossDocImageDetailInfo & {
  imageDataUrl?: string;
};

type ImageGallerySectionProps = {
  images: CrossDocImageGalleryItem[];
  onPressImage: (image: CrossDocImageGalleryItem) => void;
};

const GAP = 8;
const COLS = 3;
/** 与 cross-doc-detail contentWrap、AnalysisSectionCard 内边距一致 */
const SCROLL_H_PAD = 12;
const CARD_H_PAD = 12;

const GalleryThumbCell = memo(function GalleryThumbCell({
  imageId,
  size,
  borderRadius,
  onPress,
}: {
  imageId: number;
  size: number;
  borderRadius: number;
  onPress: () => void;
}) {
  const { userId } = useAuth();
  const [source, setSource] = useState<ImageSource | undefined>();

  useEffect(() => {
    let cancelled = false;
    getToken().then((token) => {
      if (cancelled) return;
      setSource({
        uri: getThumbnailUrl(imageId, userId),
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    });
    return () => {
      cancelled = true;
    };
  }, [imageId, userId]);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
    >
      {source ? (
        <Image
          source={source}
          recyclingKey={getThumbnailUrl(imageId, userId)}
          cachePolicy="none"
          contentFit="cover"
          variant="default"
          style={styles.cellImage}
        />
      ) : (
        <View style={[styles.cellImage, styles.cellPlaceholder]} />
      )}
    </Pressable>
  );
});

export function ImageGallerySection({
  images,
  onPressImage,
}: ImageGallerySectionProps) {
  const { width: winW } = useWindowDimensions();

  const cellSize = useMemo(() => {
    const inner = winW - SCROLL_H_PAD * 2 - CARD_H_PAD * 2;
    return (inner - GAP * (COLS - 1)) / COLS;
  }, [winW]);

  const displayImages = images.filter((item) => Number.isFinite(item.id) && item.id > 0);

  return (
    <AnalysisSectionCard title="图片" defaultOpen>
      {displayImages.length ? (
        <View style={styles.galleryWrap}>
          <View style={styles.row}>
            {displayImages.map((item) => (
              <GalleryThumbCell
                key={item.id}
                imageId={item.id}
                size={cellSize}
                borderRadius={10}
                onPress={() => onPressImage(item)}
              />
            ))}
          </View>
        </View>
      ) : (
        <ThemedText>暂无图片数据</ThemedText>
      )}
    </AnalysisSectionCard>
  );
}

const styles = StyleSheet.create({
  galleryWrap: {
    minHeight: 120,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cell: {
    overflow: 'hidden',
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  cellPlaceholder: {
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
});
