import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function DeprecatedDetailScreen() {
  const { imageId, title } = useLocalSearchParams<{ imageId?: string; title?: string }>();

  if (imageId) {
    return (
      <Redirect
        href={{
          pathname: '/image-detail' as any,
          params: { imageId, title },
        }}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText>detail 页面已弃用，请从记录页进入新的图片详情页。</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});