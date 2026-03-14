import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';

type ZoomableImageModalProps = {
  visible: boolean;
  imageUri?: string;
  onClose: () => void;
};

export function ZoomableImageModal({ visible, imageUri, onClose }: ZoomableImageModalProps) {
  const scale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(event.scale, 1, 4);
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
      <Pressable style={styles.overlay} onPress={closeAndReset}>
        <View style={styles.inner}>
          {imageUri ? (
            <GestureDetector gesture={pinch}>
              <Animated.View style={[styles.imageWrap, animatedStyle]}>
                <Image source={{ uri: imageUri }} resizeMode="contain" style={styles.image} />
              </Animated.View>
            </GestureDetector>
          ) : null}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
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
