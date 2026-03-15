import { ThemedText } from '@/components/themed-text';
import { useColor } from '@/hooks/useColor';
import { Image, Pressable, StyleSheet, View } from 'react-native';

type ImagePreviewPanelProps = {
  imageUri?: string;
  loading: boolean;
  onPressImage: () => void;
};

export function ImagePreviewPanel({ imageUri, loading, onPressImage }: ImagePreviewPanelProps) {
  const surface = useColor('background', { light: '#d9d9da', dark: '#2a2e35' });

  return (
    <View style={[styles.container, { backgroundColor: surface }]}> 
      {imageUri ? (
        <Pressable style={styles.imageWrap} onPress={onPressImage}>
          <Image source={{ uri: imageUri }} resizeMode="contain" style={styles.image} />
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
