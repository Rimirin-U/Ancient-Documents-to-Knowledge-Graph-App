import { ThemedText } from '@/components/themed-text';
import { Image } from '@/components/ui/image';
import { useColor } from '@/hooks/useColor';
import { Pressable, StyleSheet, View } from 'react-native';

type ImagePreviewPanelProps = {
  imageUri?: string;
  loading: boolean;
  onPressImage: () => void;
};

export function ImagePreviewPanel({ imageUri, loading, onPressImage }: ImagePreviewPanelProps) {
  const surface = useColor('background', { light: '#f6f7f9', dark: '#1d2229' });

  return (
    <View style={[styles.container, { backgroundColor: surface }]}> 
      {imageUri ? (
        <Pressable style={styles.imageWrap} onPress={onPressImage}>
          <Image source={{ uri: imageUri }} contentFit="contain" variant="default" style={styles.image} />
        </Pressable>
      ) : (
        <View style={styles.placeholder}>
          <ThemedText>{loading ? '加载图片中...' : '图片加载失败'}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageWrap: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
