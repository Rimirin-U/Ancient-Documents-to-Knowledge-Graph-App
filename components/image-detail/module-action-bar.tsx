import { useThemeColor } from '@/hooks/useColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
  const normalRing = useThemeColor({ light: '#d4a31c', dark: '#cfaf58' }, 'icon');
  const activeRing = useThemeColor({ light: '#8d6b0e', dark: '#f0d98e' }, 'text');
  const iconColor = useThemeColor({ light: '#c69212', dark: '#d7bb68' }, 'icon');

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
            <Pressable
              key={index}
              onPress={() => onSelect(index)}
              disabled={disabled}
              style={[
                styles.circle,
                {
                  borderColor: active ? activeRing : normalRing,
                  opacity: disabled ? 0.55 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.circleDot,
                  {
                    backgroundColor: active ? activeRing : 'transparent',
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.iconGroup}>
        <Pressable onPress={onCopy} disabled={disabled} style={styles.iconButton}>
          <MaterialIcons name="content-copy" size={18} color={iconColor} style={{ opacity: disabled ? 0.55 : 1 }} />
        </Pressable>
        <Pressable onPress={onRefresh} disabled={disabled} style={styles.iconButton}>
          <MaterialIcons name="refresh" size={19} color={iconColor} style={{ opacity: disabled ? 0.55 : 1 }} />
        </Pressable>
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
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 8,
  },
  iconButton: {
    padding: 2,
  },
});
