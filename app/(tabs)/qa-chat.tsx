import { useToast } from '@/components/ui/toast';
import { useColor } from '@/hooks/useColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { querySmartChat } from '@/services/chat';
import { getStorageItem, setStorageItem } from '@/services/storage';
import { useHeaderHeight } from '@react-navigation/elements';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bubble, GiftedChat, IMessage } from 'react-native-gifted-chat';

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: IMessage[];
};

const CHAT_SESSIONS_KEY = 'qa_chat_sessions_v1';
const ACTIVE_SESSION_KEY = 'qa_chat_active_session_v1';

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptySession(): ChatSession {
  const now = new Date().toISOString();
  return {
    id: createId('session'),
    title: '新对话',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function normalizeMessages(messages: unknown): IMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const rawCreatedAt = item.createdAt;
      const createdAt =
        typeof rawCreatedAt === 'string' || typeof rawCreatedAt === 'number'
          ? new Date(rawCreatedAt)
          : new Date();

      const rawUser = item.user;
      const userObj =
        rawUser && typeof rawUser === 'object'
          ? (rawUser as { _id?: string | number; name?: string; avatar?: string | number })
          : undefined;

      return {
        _id: typeof item._id === 'string' || typeof item._id === 'number' ? item._id : createId('msg'),
        text: typeof item.text === 'string' ? item.text : '',
        createdAt,
        user: {
          _id: userObj?._id ?? 'assistant',
          name: userObj?.name,
          avatar: userObj?.avatar,
        },
      } as IMessage;
    });
}

function normalizeSessions(raw: unknown): ChatSession[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : createId('session'),
      title: typeof item.title === 'string' && item.title.trim() ? item.title : '未命名会话',
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
      messages: normalizeMessages(item.messages),
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function makeSessionTitle(question: string): string {
  const cleaned = question.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '新对话';
  return cleaned.length > 16 ? `${cleaned.slice(0, 16)}...` : cleaned;
}

export default function QaChatScreen() {
  const toast = useToast();
  const headerHeight = useHeaderHeight();
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = useColor('background');
  const cardColor = useColor('card');
  const borderColor = useColor('border');
  const textColor = useColor('text');
  const mutedColor = useColor('textMuted');
  const primaryColor = useColor('blue');

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPersistedData() {
      try {
        const [sessionsRaw, activeRaw] = await Promise.all([
          getStorageItem(CHAT_SESSIONS_KEY),
          getStorageItem(ACTIVE_SESSION_KEY),
        ]);

        const parsedSessions = normalizeSessions(sessionsRaw ? JSON.parse(sessionsRaw) : []);
        const currentSession = parsedSessions.length ? parsedSessions[0] : createEmptySession();

        const canUseActive =
          typeof activeRaw === 'string' && parsedSessions.some((session) => session.id === activeRaw);

        if (!cancelled) {
          setSessions(parsedSessions.length ? parsedSessions : [currentSession]);
          setActiveSessionId(canUseActive ? (activeRaw as string) : currentSession.id);
        }
      } catch {
        if (!cancelled) {
          const fallback = createEmptySession();
          setSessions([fallback]);
          setActiveSessionId(fallback.id);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    void loadPersistedData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    void setStorageItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
    if (activeSessionId) {
      void setStorageItem(ACTIVE_SESSION_KEY, activeSessionId);
    }
  }, [sessions, activeSessionId, isReady]);

  const activeSession = useMemo(
    () => sessions.find((item) => item.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId]
  );

  const upsertMessages = useCallback((sessionId: string, updater: (prev: IMessage[]) => IMessage[]) => {
    setSessions((prev) =>
      prev
        .map((session) => {
          if (session.id !== sessionId) return session;
          const nextMessages = updater(session.messages);
          return {
            ...session,
            messages: nextMessages,
            updatedAt: new Date().toISOString(),
          };
        })
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
  }, []);

  const createNewConversation = useCallback(() => {
    const fresh = createEmptySession();
    setSessions((prev) => [fresh, ...prev]);
    setActiveSessionId(fresh.id);
    setIsTyping(false);
    setShowHistory(false);
  }, []);

  const toggleHistory = useCallback(() => {
    if (sessions.length <= 1) {
      toast.info('暂无更多会话', '先发起几次问答再查看历史');
      return;
    }

    setShowHistory((prev) => !prev);
  }, [sessions, activeSessionId, toast]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistory(false);
  }, []);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (!activeSession?.id || !newMessages.length) return;

      setShowHistory(false);

      const userMessage = newMessages[0];
      const question = (userMessage.text || '').trim();
      if (!question) return;

      upsertMessages(activeSession.id, (prev) => GiftedChat.append(prev, newMessages));

      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSession.id && session.title === '新对话'
            ? { ...session, title: makeSessionTitle(question) }
            : session
        )
      );

      setIsTyping(true);
      try {
        const data = await querySmartChat(question);
        const answerParts = [data.answer, data.sources.length ? `\n\n参考依据：\n- ${data.sources.join('\n- ')}` : '']
          .filter(Boolean)
          .join('');

        const assistantMessage: IMessage = {
          _id: createId('assistant'),
          text: answerParts || '已收到问题，但未返回内容。',
          createdAt: new Date(),
          user: {
            _id: 'assistant',
            name: '智能助手',
          },
        };

        upsertMessages(activeSession.id, (prev) => GiftedChat.append(prev, [assistantMessage]));
      } catch (error) {
        const message = error instanceof Error ? error.message : '请稍后重试';
        toast.error('问答失败', message);

        const failedMessage: IMessage = {
          _id: createId('error'),
          text: `请求失败：${message}`,
          createdAt: new Date(),
          user: {
            _id: 'assistant',
            name: '智能助手',
          },
        };

        upsertMessages(activeSession.id, (prev) => GiftedChat.append(prev, [failedMessage]));
      } finally {
        setIsTyping(false);
      }
    },
    [activeSession, toast, upsertMessages]
  );

  if (!isReady || !activeSession) {
    return <View style={styles.container} />;
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.webFrame, Platform.OS === 'web' ? styles.webFrameWeb : null]}>
        <View style={[styles.toolbar, { borderBottomColor: borderColor, backgroundColor }]}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {activeSession.title}
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, styles.secondaryButton, { backgroundColor: cardColor, borderColor }]}
              onPress={toggleHistory}>
              <Text style={[styles.secondaryButtonText, { color: textColor }]}>历史会话列表</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={createNewConversation}>
              <Text style={styles.actionButtonText}>新对话</Text>
            </Pressable>
          </View>
        </View>

        {showHistory ? (
          <View style={[styles.historyPanel, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
            <ScrollView style={styles.historyScroll} contentContainerStyle={styles.historyScrollContent}>
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <Pressable
                    key={session.id}
                    style={[
                      styles.historyItem,
                      {
                        borderColor,
                        backgroundColor: isActive ? primaryColor : backgroundColor,
                      },
                    ]}
                    onPress={() => selectSession(session.id)}>
                    <Text
                      style={[
                        styles.historyTitle,
                        {
                          color: isActive ? '#FFFFFF' : textColor,
                        },
                      ]}
                      numberOfLines={1}>
                      {session.title}
                    </Text>
                    <Text
                      style={[
                        styles.historyMeta,
                        {
                          color: isActive ? '#E5E7EB' : mutedColor,
                        },
                      ]}>
                      {new Date(session.updatedAt).toLocaleString()}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.chatWrapper}>
          <GiftedChat
            messages={activeSession.messages}
            onSend={(messages) => {
              void onSend(messages);
            }}
            user={{ _id: 'user' }}
            isTyping={isTyping}
            colorScheme={colorScheme}
            keyboardAvoidingViewProps={{ keyboardVerticalOffset: headerHeight }}
            messagesContainerStyle={{ backgroundColor }}
            textInputProps={{
              placeholder: '请输入问题...',
              placeholderTextColor: mutedColor,
              style: { color: textColor },
            }}
            renderBubble={(props) => (
              <Bubble
                {...props}
                wrapperStyle={{
                  left: { backgroundColor: cardColor },
                  right: { backgroundColor: primaryColor },
                }}
                textStyle={{
                  left: { color: textColor },
                  right: { color: '#FFFFFF' },
                }}
              />
            )}
            listProps={{
              style: styles.chatList,
              maintainVisibleContentPosition: {
                minIndexForVisible: 0,
              },
            }}
          />
        </View>

        {Platform.OS === 'android' ? <View style={styles.androidSpacer} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webFrame: {
    flex: 1,
    width: '100%',
    minWidth: 0,
  },
  webFrameWeb: {
    maxWidth: 980,
    alignSelf: 'center',
  },
  toolbar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyPanel: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxHeight: 220,
  },
  historyScroll: {
    width: '100%',
  },
  historyScrollContent: {
    padding: 8,
    gap: 8,
  },
  historyItem: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyMeta: {
    fontSize: 11,
  },
  chatWrapper: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  chatList: {
    minWidth: 0,
  },
  androidSpacer: {
    height: 4,
  },
});
