import { ThemedText } from '@/components/themed-text';
import { useColor } from '@/hooks/useColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

type ViewType = 'image' | 'cross-doc';

type FloatingViewSwitchProps = {
  currentView: ViewType;
  open: boolean;
  onToggleOpen: () => void;
  onSelectView: (view: ViewType) => void;
};

const viewLabelMap: Record<ViewType, string> = {
  image: '图片',
  'cross-doc': '跨文档',
};

const SWITCH_FADE_DURATION = 100;

export function FloatingViewSwitch({
  currentView,
  open,
  onToggleOpen,
  onSelectView,
}: FloatingViewSwitchProps) {
  const panelBg = useColor('background', { light: '#f3f4f6', dark: '#22272f' });
  const panelBorder = useColor('icon', { light: '#d7dae0', dark: '#3a414c' });
  const arrowColor = useColor('icon', { light: '#616976', dark: '#a1a9b5' });
  const panelOpacity = useRef(new Animated.Value(open ? 1 : 0)).current;
  const [panelVisible, setPanelVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setPanelVisible(true);
    }

    Animated.timing(panelOpacity, {
      toValue: open ? 1 : 0,
      duration: SWITCH_FADE_DURATION,
      easing: open ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) {
        setPanelVisible(false);
      }
    });
  }, [open, panelOpacity]);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {panelVisible ? (
        <Animated.View
          style={[
            styles.panel,
            { backgroundColor: panelBg, borderColor: panelBorder },
            {
              opacity: panelOpacity,
              transform: [
                {
                  translateY: panelOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SwitchRow
            label="图片"
            active={currentView === 'image'}
            onPress={() => onSelectView('image')}
          />
          <SwitchRow
            label="跨文档"
            active={currentView === 'cross-doc'}
            onPress={() => onSelectView('cross-doc')}
          />
        </Animated.View>
      ) : null}

      <Pressable
        style={[styles.trigger, { backgroundColor: panelBg, borderColor: panelBorder }]}
        onPress={onToggleOpen}
      >
        <ThemedText style={styles.triggerText}>{viewLabelMap[currentView]}</ThemedText>
        <MaterialIcons
          name={open ? 'keyboard-arrow-down' : 'keyboard-arrow-up'}
          size={18}
          color={arrowColor}
        />
      </Pressable>
    </View>
  );
}

function SwitchRow({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const activeTint = useColor('tint');
  return (
    <Pressable style={styles.optionRow} onPress={onPress}>
      <ThemedText
        style={[
          styles.optionText,
          active ? { color: activeTint, fontWeight: '600' } : null,
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    alignItems: 'flex-end',
  },
  panel: {
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d7dae0',
  },
  optionRow: {
    minWidth: 92,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 18,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d7dae0',
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 2,
  },
  triggerText: {
    fontSize: 14,
    lineHeight: 18,
  },
});
