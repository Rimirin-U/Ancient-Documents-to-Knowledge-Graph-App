import { ThemedText } from '@/components/themed-text';
import { useColor } from '@/hooks/useColor';
import { StyleSheet, View } from 'react-native';

type StructuredContentListProps = {
  content: Record<string, unknown>;
};

export function StructuredContentList({ content }: StructuredContentListProps) {
  const keys = Object.keys(content);
  const borderColor = useColor('icon', { light: '#d6dae1', dark: '#39414d' });
  const keyColor = useColor('icon', { light: '#4c5360', dark: '#adb6c2' });

  if (!keys.length) {
    return <ThemedText>结构化结果为空</ThemedText>;
  }

  return (
    <View style={[styles.list, { borderColor }]}>
      {keys.map((key) => (
        <View key={key} style={[styles.row, { borderColor }]}>
          <ThemedText style={[styles.keyText, { color: keyColor }]}>{key}</ThemedText>
          <ThemedText style={styles.valueText}>{String(content[key] ?? '')}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  keyText: {
    width: 86,
    fontSize: 14,
    lineHeight: 20,
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
