import { ThemedText } from '@/components/themed-text';
import { PropsWithChildren, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';

type AnalysisSectionCardProps = PropsWithChildren<{
  title: string;
  defaultOpen?: boolean;
}>;

export function AnalysisSectionCard({
  title,
  defaultOpen = true,
  children,
}: AnalysisSectionCardProps) {
  const [value, setValue] = useState<string | string[]>(defaultOpen ? 'content' : '');

  return (
    <Card style={styles.card}>
      <Accordion
        type="single"
        collapsible
        value={value}
        onValueChange={setValue}
      >
        <AccordionItem value="content">
          <AccordionTrigger>
            <ThemedText type="defaultSemiBold">{title}</ThemedText>
          </AccordionTrigger>
          <AccordionContent>
            <View style={styles.content}>{children}</View>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  content: {
    marginTop: 2,
    gap: 8,
  },
});
