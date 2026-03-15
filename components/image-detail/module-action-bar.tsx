import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { Copy, RefreshCw } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

type ModuleActionBarProps = {
  count: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onCopy: () => void;
  onRefresh: () => void;
  disabled?: boolean;
};

export function ModuleActionBar({
  count,
  selectedIndex,
  onSelect,
  onCopy,
  onRefresh,
  disabled,
}: ModuleActionBarProps) {
  const normalRing = useColor('icon', { light: '#d4a31c', dark: '#cfaf58' });
  const activeRing = useColor('text', { light: '#8d6b0e', dark: '#f0d98e' });
  const selectorText = useColor('text', { light: '#5e4a10', dark: '#f0d98e' });

  const safeCount = Math.max(1, count);

  return (
    <View style={styles.row}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.circleGroup}
      >
        {Array.from({ length: safeCount }).map((_, index) => {
          const active = index === selectedIndex;
          return (
            <Button
              key={index}
              onPress={() => onSelect(index)}
              disabled={disabled}
              size="icon"
              variant={active ? 'default' : 'outline'}
              style={[
                styles.circle,
                {
                  borderColor: active ? activeRing : normalRing,
                  backgroundColor: active ? activeRing : 'transparent',
                },
              ]}
            >
              <Text style={[styles.circleLabel, { color: active ? '#fff' : selectorText }]}>
                {index + 1}
              </Text>
            </Button>
          );
        })}
      </ScrollView>

      <View style={styles.iconGroup}>
        <Button size="icon" variant="outline" icon={Copy} onPress={onCopy} disabled={disabled} />
        <Button size="icon" variant="outline" icon={RefreshCw} onPress={onRefresh} disabled={disabled} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  circleGroup: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  circleLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 8,
  },
});
