import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image } from '@/components/ui/image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

type ZoomableImageModalProps = {
  visible: boolean;
  imageUri?: string;
  onClose: () => void;
};

export function ZoomableImageModal({ visible, imageUri, onClose }: ZoomableImageModalProps) {
  const scale = useSharedValue(1);
  const scaleOffset = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      scaleOffset.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = clamp(scaleOffset.value * event.scale, 1, 4);
    })
    .onEnd(() => {
      if (scale.value < 1.02) {
        scale.value = withTiming(1, { duration: 160 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function closeAndReset() {
    scale.value = 1;
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeAndReset}>
      <GestureHandlerRootView style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeAndReset} />
        <View style={styles.inner} pointerEvents="box-none">
          {imageUri ? (
            <GestureDetector gesture={pinch}>
              <Animated.View style={[styles.imageWrap, animatedStyle]}>
                <Image source={{ uri: imageUri }} contentFit="contain" variant="default" style={styles.image} />
              </Animated.View>
            </GestureDetector>
          ) : null}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
