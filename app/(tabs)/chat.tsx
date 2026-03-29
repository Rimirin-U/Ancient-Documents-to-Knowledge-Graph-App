import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { AvoidKeyboard } from '@/components/ui/avoid-keyboard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColor } from '@/hooks/useColor';
import {
  sendChatQuery,
  sendChatQueryStream,
  getKbStatus,
  triggerReindex,
  ChatSource,
  ChatHistoryTurn,
} from '@/services/chat';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/services/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Send } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
  '谁同时在多份文书中出现？',
];

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  isTyping?: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'chat_messages_v2';

const VALID = (v?: string) => v && v !== '未识别' && v !== '未记载';

/** 格式化消息时间戳 */
function formatTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;
  const diffDays = Math.floor((now.getTime() - ts) / 86_400_000);
  if (diffDays === 0) return timeStr;
  if (diffDays === 1) return `昨天 ${timeStr}`;
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mo}/${dd} ${timeStr}`;
}

/** 三点打字动效（等待 AI 回答时显示） */
function TypingIndicator({ bg }: { bg: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(Math.max(0, 1200 - delay - 600)),
        ]),
      );

    const anim = Animated.parallel([makeLoop(dot1, 0), makeLoop(dot2, 150), makeLoop(dot3, 300)]);
    anim.start();
    return () => anim.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View style={[styles.messageBubble, styles.typingBubble, { backgroundColor: bg }]}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.typingDot,
            {
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function SourceCard({
  source,
  cardBg,
  textColor,
  badgeColor,
}: {
  source: ChatSource;
  cardBg: string;
  textColor: string;
  badgeColor: string;
}) {
  const metaItems: { icon: string; label: string; value: string }[] = [];
  if (VALID(source.time))     metaItems.push({ icon: '📅', label: '时间', value: source.time });
  if (VALID(source.location)) metaItems.push({ icon: '📍', label: '地点', value: source.location });
  if (VALID(source.seller))   metaItems.push({ icon: '👤', label: '卖方', value: source.seller });
  if (VALID(source.buyer))    metaItems.push({ icon: '👤', label: '买方', value: source.buyer });
  if (VALID(source.price))    metaItems.push({ icon: '💰', label: '价格', value: source.price });
  if (VALID(source.subject))  metaItems.push({ icon: '📜', label: '标的', value: source.subject });

  return (
    <View style={[styles.sourceCard, { backgroundColor: cardBg }]}>
      <View style={styles.sourceHeader}>
        <View style={[styles.sourceIndexBadge, { backgroundColor: badgeColor }]}>
          <ThemedText style={styles.sourceIndexText}>[{source.index}]</ThemedText>
        </View>
        <ThemedText style={[styles.sourceFilename, { color: textColor }]} numberOfLines={1}>
          {source.filename || '未知文书'}
        </ThemedText>
      </View>
      {metaItems.length > 0 && (
        <View style={styles.sourceMeta}>
          {metaItems.map((m) => (
            <ThemedText key={m.label} style={styles.sourceMetaText}>
              {m.icon} {m.value}
            </ThemedText>
          ))}
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

  const pageBg = useColor('screen');
  const messageUserBg = useColor('primary');
  const messageUserFg = useColor('primaryForeground');
  const messageBotBg = useColor('card');
  const sourceCardBg = useColor('secondary');
  const inputBg = useColor('card');
  const borderColor = useColor('border');
  const textColor     = useColor('text',       {});
  const subTextColor = useColor('mutedForeground');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [kbCount, setKbCount] = useState<number | null>(null);
  const [reindexing, setReindexing] = useState(false);

  // 从本地存储恢复历史消息
  useEffect(() => {
    getStorageItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setMessages(JSON.parse(raw));
        } catch (_) {}
      }
    });
    getKbStatus().then(setKbCount);
  }, []);

  // 每次进入问答页刷新文书数量（上传/OCR 完成后从其他 Tab 切回可见最新）
  useFocusEffect(
    useCallback(() => {
      getKbStatus().then(setKbCount);
    }, []),
  );

  // 持久化消息（最多保存 30 条）
  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.filter((m) => !m.isTyping).slice(-30);
      setStorageItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [messages]);

  // 新消息时滚动到底部
  useEffect(() => {
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages]);

  function handleClear() {
    setMessages([]);
    removeStorageItem(STORAGE_KEY);
  }

  async function handleReindex() {
    setReindexing(true);
    try {
      const msg = await triggerReindex();
      toast.info('重建知识库', msg);
      setTimeout(() => getKbStatus().then(setKbCount), 2000);
    } catch (err) {
      toast.error('失败', err instanceof Error ? err.message : '重建失败');
    } finally {
      setReindexing(false);
    }
  }

  async function handleSend() {
    const text = inputText.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };

    const botMsgId = `bot_${Date.now() + 1}`;
    const placeholderMsg: Message = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      isTyping: true,
      createdAt: Date.now() + 1,
    };

    // 取历史（不含占位符）
    const history: ChatHistoryTurn[] = messages
      .filter((m) => !m.isTyping)
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInputText('');
    setLoading(true);

    let pendingSources: ChatSource[] | undefined;
    let accumulatedText = '';

    await sendChatQueryStream(text, history, {
      onText(delta) {
        accumulatedText += delta;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? { ...m, content: accumulatedText, isTyping: false }
              : m,
          ),
        );
      },
      onSources(sources) {
        pendingSources = sources.length > 0 ? sources : undefined;
      },
      onDone() {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content: accumulatedText || '（未生成回答，请重试）',
                  sources: pendingSources,
                  isTyping: false,
                }
              : m,
          ),
        );
        setLoading(false);
      },
      async onError(errorMsg, status) {
        // 流式接口不可用（服务端未更新 / 环境不支持 ReadableStream），自动降级到非流式接口
        if (status === 404 || status === -1) {
          try {
            const data = await sendChatQuery(text, history);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? {
                      ...m,
                      content: data.answer,
                      sources: data.sources?.length ? data.sources : undefined,
                      isTyping: false,
                    }
                  : m,
              ),
            );
          } catch (fallbackErr) {
            setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
            toast.error('问答失败', fallbackErr instanceof Error ? fallbackErr.message : '发送失败');
          }
          setLoading(false);
          return;
        }
        setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
        toast.error('问答失败', errorMsg);
        setLoading(false);
      },
    });
  }

  /** 长按消息：复制内容 + 震动反馈 */
  async function handleLongPress(content: string) {
    await Clipboard.setStringAsync(content);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.info('已复制', '消息内容已复制到剪贴板');
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: pageBg }]}>
      {/* 顶部状态栏 */}
      <View style={[styles.topBar, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => getKbStatus().then(setKbCount)} style={styles.kbStatus}>
          <MaterialIcons name="library-books" size={14} color={subTextColor} />
          <ThemedText style={[styles.kbStatusText, { color: subTextColor }]}>
            {kbCount === null ? '加载中…' : `知识库 ${kbCount} 份文书`}
          </ThemedText>
        </Pressable>

        <View style={styles.topBarActions}>
          <Pressable onPress={handleReindex} disabled={reindexing} style={styles.iconBtn}>
            {reindexing ? (
              <ActivityIndicator size={14} color={subTextColor} />
            ) : (
              <MaterialIcons name="sync" size={16} color={subTextColor} />
            )}
          </Pressable>
          {messages.length > 0 && (
            <Pressable onPress={handleClear} style={styles.clearBtn}>
              <MaterialIcons name="delete-outline" size={16} color={subTextColor} />
              <ThemedText style={[styles.clearText, { color: subTextColor }]}>清空</ThemedText>
            </Pressable>
          )}
        </View>
      </View>

      {/* 消息列表 */}
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
              {/* 气泡 */}
              {item.isTyping && !item.content ? (
                <TypingIndicator bg={messageBotBg} />
              ) : (
                <Pressable
                  onLongPress={() => handleLongPress(item.content)}
                  delayLongPress={400}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      {
                        backgroundColor:
                          item.role === 'user' ? messageUserBg : messageBotBg,
                        alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                      },
                    ]}
                  >
                    <ThemedText
                      style={{
                        color: item.role === 'user' ? messageUserFg : textColor,
                        lineHeight: 22,
                      }}
                    >
                      {item.content}
                    </ThemedText>
                  </View>
                </Pressable>
              )}

              {/* 时间戳 */}
              {!item.isTyping && (
                <ThemedText
                  style={[
                    styles.timestamp,
                    {
                      color: subTextColor,
                      alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                    },
                  ]}
                >
                  {formatTime(item.createdAt)}
                </ThemedText>
              )}

              {/* 引用溯源卡片（仅 assistant 且有 sources） */}
              {item.role === 'assistant' && item.sources && item.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                  <ThemedText style={[styles.sourcesLabel, { color: subTextColor }]}>
                    参考文书：
                  </ThemedText>
                  {item.sources.map((src: ChatSource) => (
                    <SourceCard
                      key={src.index}
                      source={src}
                      cardBg={sourceCardBg}
                      textColor={textColor}
                      badgeColor={messageUserBg}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="chat-bubble-outline" size={48} color={subTextColor} />
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
              文档智能问答
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: subTextColor }]}>
              {kbCount != null && kbCount > 0
                ? `当前知识库包含 ${kbCount} 份文书，可以这样提问：`
                : kbCount === 0
                  ? '暂无已完成 OCR 的文书。请先在首页上传并完成识别后再提问；右上角 ↻ 用于重建向量索引（可选）。'
                  : '上传并完成 OCR 识别后，可以这样提问：'}
            </ThemedText>
            <View style={styles.suggestionsWrap}>
              {EXAMPLE_QUESTIONS.map((q) => (
                <Pressable
                  key={q}
                  style={[
                    styles.suggestionChip,
                    { borderColor, backgroundColor: messageBotBg },
                  ]}
                  onPress={() => setInputText(q)}
                >
                  <ThemedText style={[styles.suggestionText, { color: textColor }]}>
                    {q}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        }
      />

      {/* 输入栏 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[
          styles.inputContainer,
          { backgroundColor: inputBg, borderTopColor: borderColor },
        ]}
      >
        <TextInput
          style={[styles.input, { color: textColor, backgroundColor: pageBg }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="输入问题..."
          placeholderTextColor={subTextColor}
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />
        <Button
          size="sm"
          onPress={handleSend}
          disabled={loading || !inputText.trim()}
          style={styles.sendButton}
          icon={Send}
        >
          {loading && (
            <ActivityIndicator size="small" color={messageUserFg} />
          )}
        </Button>
      </KeyboardAvoidingView>

      {/* 动态键盘间距 */}
      <AvoidKeyboard offset={insets.bottom} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },

  // 空状态
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
    opacity: 0.8,
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

  // 消息行
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowBot: { justifyContent: 'flex-start' },
  messageColumn: {
    maxWidth: '85%',
    gap: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 14,
  },

  // 打字动效
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignSelf: 'flex-start',
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#999',
  },

  // 时间戳
  timestamp: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },

  // 引用溯源
  sourcesContainer: {
    gap: 4,
    paddingLeft: 2,
    marginTop: 2,
  },
  sourcesLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  sourceCard: {
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceIndexBadge: {
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
    opacity: 0.75,
  },
  sourceExcerpt: {
    fontSize: 11,
    opacity: 0.6,
    lineHeight: 16,
    marginTop: 2,
  },

  // 输入区
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
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

  // 顶部栏
  topBar: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kbStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kbStatusText: {
    fontSize: 12,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    padding: 4,
  },
  clearText: { fontSize: 12 },
});
