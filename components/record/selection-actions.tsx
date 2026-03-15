import { Button } from '@/components/ui/button';
import { StyleSheet, View } from 'react-native';

type SelectionActionsProps = {
  onCancel: () => void;
  onAnalyze?: () => void;
  onDelete: () => void;
  disabled?: boolean;
  showAnalyze?: boolean;
};

export function SelectionActions({
  onCancel,
  onAnalyze,
  onDelete,
  disabled,
  showAnalyze = true,
}: SelectionActionsProps) {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <ActionButton label="取消" kind="cancel" onPress={onCancel} />
      {showAnalyze && onAnalyze ? (
        <ActionButton label="分析" kind="primary" onPress={onAnalyze} disabled={disabled} />
      ) : null}
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
  const variantMap = {
    cancel: 'secondary',
    primary: 'default',
    danger: 'destructive',
  } as const;

  return (
    <Button
      size="sm"
      variant={variantMap[kind]}
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
    >
      {label}
    </Button>
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
    minWidth: 68,
  },
});
