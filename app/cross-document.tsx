import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';

export default function CrossDocumentScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="defaultSemiBold">跨文档页面（暂未开放）</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
