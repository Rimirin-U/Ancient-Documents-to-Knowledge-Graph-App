import { CrossDocImageDetailInfo } from '@/components/cross-doc-detail/image-info-sheet';
import { AnalysisSectionCard } from '@/components/image-detail/analysis-section-card';
import { Gallery, GalleryItem } from '@/components/ui/gallery';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { Download, Info } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export type CrossDocImageGalleryItem = CrossDocImageDetailInfo & {
  imageDataUrl: string;
};

type ImageGallerySectionProps = {
  images: CrossDocImageGalleryItem[];
  onPressImageDetail: (image: CrossDocImageGalleryItem) => void;
  onPressImageDownload: (image: CrossDocImageGalleryItem) => void;
};

export function ImageGallerySection({
  images,
  onPressImageDetail,
  onPressImageDownload,
}: ImageGallerySectionProps) {
  const items: GalleryItem[] = images.map((item) => ({
    id: String(item.id),
    uri: item.imageDataUrl,
    thumbnail: item.imageDataUrl,
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
            showTitles={false}
            showDescriptions={false}
            showPages={false}
            showThumbnails={false}
            scrollEnabled={false}
            enableFullscreen
            enableZoom
            renderFullscreenTopLeft={(item) => {
              const current = images.find((image) => String(image.id) === item.id);
              if (!current) {
                return null;
              }

              return (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    icon={Info}
                    onPress={() => onPressImageDetail(current)}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    icon={Download}
                    onPress={() => onPressImageDownload(current)}
                  />
                </>
              );
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
