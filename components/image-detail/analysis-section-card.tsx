import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type AnalysisSectionCardProps = PropsWithChildren<{
  title: string;
  defaultOpen?: boolean;
}>;

export function AnalysisSectionCard({
  title,
  defaultOpen = true,
  children,
}: AnalysisSectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const cardBg = useThemeColor({ light: '#f2f3f5', dark: '#252b34' }, 'background');
  const cardBorder = useThemeColor({ light: '#dbdee4', dark: '#39424f' }, 'icon');

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}> 
      <Pressable style={styles.header} onPress={() => setOpen((prev) => !prev)}>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <MaterialIcons name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} />
      </Pressable>
      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  content: {
    marginTop: 8,
    gap: 8,
  },
});
