import { CrossDocImageDetailInfo } from '@/components/cross-doc-detail/image-info-sheet';
import { AnalysisSectionCard } from '@/components/image-detail/analysis-section-card';
import { Gallery, GalleryItem } from '@/components/ui/gallery';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View } from 'react-native';

export type CrossDocImageGalleryItem = CrossDocImageDetailInfo & {
  imageDataUrl?: string;
};

type ImageGallerySectionProps = {
  images: CrossDocImageGalleryItem[];
  onPressImage: (image: CrossDocImageGalleryItem) => void;
};

export function ImageGallerySection({
  images,
  onPressImage,
}: ImageGallerySectionProps) {
  const validImages = images.filter((item) => item.imageDataUrl);
  const items: GalleryItem[] = validImages.map((item) => ({
    id: String(item.id),
    uri: item.imageDataUrl!,
    thumbnail: item.imageDataUrl!,
    title: item.title,
  }));

  return (
    <AnalysisSectionCard title="图片" defaultOpen>
      {items.length ? (
        <View style={styles.galleryWrap}>
          <Gallery
            items={items}
            columns={3}
            spacing={8}
            aspectRatio={1}
            borderRadius={10}
            galleryBackgroundColor="transparent"
            showTitles={false}
            showDescriptions={false}
            showPages={false}
            enableFullscreen={false}
            scrollEnabled={false}
            onItemPress={(item) => {
              const current = validImages.find((image) => String(image.id) === item.id);
              if (current) {
                onPressImage(current);
              }
            }}
          />
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
});
