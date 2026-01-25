import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';

export default function MyTest() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#f3dffd', dark: '#5E0989' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#FFFFFF"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
        <ThemedText>Hello!</ThemedText>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
});
