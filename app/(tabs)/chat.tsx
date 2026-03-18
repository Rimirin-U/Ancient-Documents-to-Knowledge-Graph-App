import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColor } from '@/hooks/useColor';
import { sendChatQuery } from '@/services/chat';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const listRef = useRef<FlatList>(null);

  const pageBg = useColor('background', { light: '#eceef1', dark: '#121418' });
  const messageUserBg = useColor('tint', { light: '#0a7ea4', dark: '#0a7ea4' });
  const messageUserText = '#ffffff';
  const messageBotBg = useColor('background', { light: '#ffffff', dark: '#21262e' });
  const inputBg = useColor('background', { light: '#ffffff', dark: '#21262e' });
  const borderColor = useColor('icon', { light: '#d7dae0', dark: '#3a414c' });
  const textColor = useColor('text', {});

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 滚动到底部
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

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
      const reply = await sendChatQuery(text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
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
            <View
              style={[
                styles.messageBubble,
                {
                  backgroundColor: item.role === 'user' ? messageUserBg : messageBotBg,
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
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="chat-bubble-outline" size={48} color={borderColor} />
            <ThemedText style={{ color: borderColor, marginTop: 12 }}>
              开始与文档助手对话吧
            </ThemedText>
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
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
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
});
