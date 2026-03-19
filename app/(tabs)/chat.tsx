import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColor } from '@/hooks/useColor';
import { sendChatQuery, ChatSource } from '@/services/chat';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/services/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EXAMPLE_QUESTIONS = [
  '这批地契中涉及哪些买卖双方？',
  '哪些地块出现了多次交易？',
  '交易价格最高的文书是哪份？',
  '有哪些地契来自同一地区？',
  '这些文书的时间跨度是多少年？',
];

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  createdAt: number;
};

function SourceCard({ source, cardBg, textColor }: { source: ChatSource; cardBg: string; textColor: string }) {
  const hasTime = source.time && source.time !== '未识别';
  const hasLocation = source.location && source.location !== '未识别';
  return (
    <View style={[styles.sourceCard, { backgroundColor: cardBg }]}>
      <View style={styles.sourceHeader}>
        <View style={styles.sourceIndexBadge}>
          <ThemedText style={styles.sourceIndexText}>[{source.index}]</ThemedText>
        </View>
        <ThemedText style={[styles.sourceFilename, { color: textColor }]} numberOfLines={1}>
          {source.filename || '未知文件'}
        </ThemedText>
      </View>
      {(hasTime || hasLocation) && (
        <View style={styles.sourceMeta}>
          {hasTime && (
            <ThemedText style={styles.sourceMetaText}>📅 {source.time}</ThemedText>
          )}
          {hasLocation && (
            <ThemedText style={styles.sourceMetaText}>📍 {source.location}</ThemedText>
          )}
        </View>
      )}
      {source.excerpt && (
        <ThemedText style={[styles.sourceExcerpt, { color: textColor }]} numberOfLines={2}>
          {source.excerpt}
        </ThemedText>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const listRef = useRef<FlatList>(null);

  const pageBg = useColor('background', { light: '#eceef1', dark: '#121418' });
  const messageUserBg = useColor('tint', { light: '#0a7ea4', dark: '#0a7ea4' });
  const messageUserText = '#ffffff';
  const messageBotBg = useColor('background', { light: '#ffffff', dark: '#21262e' });
  const sourceCardBg = useColor('background', { light: '#f0f4f8', dark: '#2a3040' });
  const inputBg = useColor('background', { light: '#ffffff', dark: '#21262e' });
  const borderColor = useColor('icon', { light: '#d7dae0', dark: '#3a414c' });
  const textColor = useColor('text', {});

  const STORAGE_KEY = 'chat_messages';

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStorageItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setMessages(JSON.parse(raw));
        } catch (_) {}
      }
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.slice(-30);
      setStorageItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [messages]);

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  function handleClear() {
    setMessages([]);
    removeStorageItem(STORAGE_KEY);
  }

  async function handleSend() {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const data = await sendChatQuery(text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources?.length ? data.sources : undefined,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '发送失败';
      toast.error('错误', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBg }]}>
      {messages.length > 0 && (
        <View style={[styles.topBar, { borderBottomColor: borderColor }]}>
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <MaterialIcons name="delete-outline" size={18} color={borderColor} />
            <ThemedText style={[styles.clearText, { color: borderColor }]}>清空记录</ThemedText>
          </Pressable>
        </View>
      )}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageRow,
              item.role === 'user' ? styles.messageRowUser : styles.messageRowBot,
            ]}
          >
            <View style={styles.messageColumn}>
              <View
                style={[
                  styles.messageBubble,
                  {
                    backgroundColor: item.role === 'user' ? messageUserBg : messageBotBg,
                    alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color: item.role === 'user' ? messageUserText : textColor,
                  }}
                >
                  {item.content}
                </ThemedText>
              </View>

              {/* 引用溯源卡片（仅 assistant 消息，且有 sources）*/}
              {item.role === 'assistant' && item.sources && item.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                  <ThemedText style={[styles.sourcesLabel, { color: borderColor }]}>
                    参考文书：
                  </ThemedText>
                  {item.sources.map((src) => (
                    <SourceCard
                      key={src.index}
                      source={src}
                      cardBg={sourceCardBg}
                      textColor={textColor}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="chat-bubble-outline" size={48} color={borderColor} />
            <ThemedText style={[styles.emptyTitle, { color: borderColor }]}>
              文档智能问答
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: borderColor }]}>
              基于您已上传的地契文书，可以这样提问：
            </ThemedText>
            <View style={styles.suggestionsWrap}>
              {EXAMPLE_QUESTIONS.map((q) => (
                <Pressable
                  key={q}
                  style={[styles.suggestionChip, { borderColor, backgroundColor: messageBotBg }]}
                  onPress={() => setInputText(q)}
                >
                  <ThemedText style={[styles.suggestionText, { color: textColor }]}>{q}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[styles.inputContainer, { backgroundColor: inputBg, borderTopColor: borderColor }]}
      >
        <TextInput
          style={[styles.input, { color: textColor, backgroundColor: pageBg }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="输入问题..."
          placeholderTextColor={borderColor}
          multiline
          maxLength={500}
        />
        <Button
          size="sm"
          onPress={handleSend}
          disabled={loading || !inputText.trim()}
          style={styles.sendButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="send" size={20} color="#fff" />
          )}
        </Button>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  suggestionsWrap: {
    marginTop: 12,
    gap: 8,
    width: '100%',
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowBot: { justifyContent: 'flex-start' },
  messageColumn: {
    maxWidth: '85%',
    gap: 6,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
  },
  sourcesContainer: {
    gap: 4,
    paddingLeft: 4,
  },
  sourcesLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  sourceCard: {
    borderRadius: 8,
    padding: 8,
    gap: 3,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceIndexBadge: {
    backgroundColor: '#0a7ea4',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sourceIndexText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sourceFilename: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  sourceMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sourceMetaText: {
    fontSize: 11,
    opacity: 0.7,
  },
  sourceExcerpt: {
    fontSize: 11,
    opacity: 0.6,
    lineHeight: 16,
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  clearText: { fontSize: 13 },
});
