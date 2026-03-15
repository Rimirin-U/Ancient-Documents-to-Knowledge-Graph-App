import { ThemedText } from '@/components/themed-text';
import { useColor } from '@/hooks/useColor';
import { Pressable, StyleSheet, View } from 'react-native';

export type StructuredDisplayItem = {
  key: string;
  label: string;
  value: string;
};

type StructuredContentListProps = {
  items: StructuredDisplayItem[];
  onCopyValue?: (value: string) => void;
};

export function StructuredContentList({ items, onCopyValue }: StructuredContentListProps) {
  const borderColor = useColor('icon', { light: '#d6dae1', dark: '#39414d' });
  const keyColor = useColor('icon', { light: '#4c5360', dark: '#adb6c2' });
  const pressedBg = useColor('background', { light: '#eceff4', dark: '#2a313b' });

  if (!items.length) {
    return <ThemedText>结构化结果为空</ThemedText>;
  }

  return (
    <View style={[styles.list, { borderColor }]}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <View
            key={item.key}
            style={[styles.row, { borderColor, borderBottomWidth: isLast ? 0 : 1 }]}
          >
            <ThemedText style={[styles.keyText, { color: keyColor }]}>{item.label}</ThemedText>
            <Pressable
              style={({ pressed }) => [styles.valuePressable, pressed && { backgroundColor: pressedBg }]}
              onPress={() => onCopyValue?.(item.value)}
            >
              <ThemedText style={styles.valueText}>{item.value || '-'}</ThemedText>
            </Pressable>
          </View>
        );
      })}
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
  valuePressable: {
    flex: 1,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  valueText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
