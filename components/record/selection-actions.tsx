import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Pressable, StyleSheet, View } from 'react-native';

type SelectionActionsProps = {
  onCancel: () => void;
  onAnalyze: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

export function SelectionActions({
  onCancel,
  onAnalyze,
  onDelete,
  disabled,
}: SelectionActionsProps) {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <ActionButton label="取消" kind="cancel" onPress={onCancel} />
      <ActionButton label="分析" kind="primary" onPress={onAnalyze} disabled={disabled} />
      <ActionButton label="删除" kind="danger" onPress={onDelete} disabled={disabled} />
    </View>
  );
}

function ActionButton({
  label,
  kind,
  onPress,
  disabled,
}: {
  label: string;
  kind: 'cancel' | 'primary' | 'danger';
  onPress: () => void;
  disabled?: boolean;
}) {
  const cancelBg = useThemeColor({ light: '#f3f4f6', dark: '#22272f' }, 'background');
  const cancelText = useThemeColor({ light: '#262b33', dark: '#d7dce3' }, 'text');

  const colorMap = {
    cancel: cancelBg,
    primary: '#10a7e0',
    danger: '#f35f67',
  } as const;

  const textMap = {
    cancel: cancelText,
    primary: '#ffffff',
    danger: '#ffffff',
  } as const;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colorMap[kind], opacity: pressed || disabled ? 0.75 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <ThemedText style={[styles.buttonText, { color: textMap[kind] }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 16,
    bottom: 70,
    alignItems: 'flex-end',
    gap: 8,
  },
  button: {
    minWidth: 62,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
});
