import { useToast } from '@/components/ui/toast';
import { useActionSheet } from '@/components/ui/action-sheet';
import { AvoidKeyboard } from '@/components/ui/avoid-keyboard';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Card } from '@/components/ui/card';
import { useColor } from '@/hooks/useColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { querySmartChat } from '@/services/chat';
import { getStorageItem, setStorageItem } from '@/services/storage';
import { useHeaderHeight } from '@react-navigation/elements';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bubble, GiftedChat, IMessage, Send } from 'react-native-gifted-chat';

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
  const navigation = useNavigation();
  const { show: showActionSheet, ActionSheet: SessionActionSheet } = useActionSheet();
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
  const [historySheetVisible, setHistorySheetVisible] = useState(false);

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
    setHistorySheetVisible(false);
  }, []);

  const openHistorySheet = useCallback(() => {
    setHistorySheetVisible(true);
  }, []);

  const closeHistorySheet = useCallback(() => {
    setHistorySheetVisible(false);
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setHistorySheetVisible(false);
  }, []);

  const deleteSession = useCallback(
    (sessionId: string) => {
      if (!sessions.some((session) => session.id === sessionId)) return;

      let nextActiveId: string | null = null;

      setSessions((prev) => {
        const filtered = prev.filter((session) => session.id !== sessionId);

        if (!filtered.length) {
          const fallback = createEmptySession();
          nextActiveId = fallback.id;
          return [fallback];
        }

        if (!filtered.some((session) => session.id === activeSessionId)) {
          nextActiveId = filtered[0].id;
        }

        return filtered;
      });

      if (nextActiveId) {
        setActiveSessionId(nextActiveId);
      }
      toast.success('会话已删除', '历史记录已更新');
    },
    [activeSessionId, sessions, toast]
  );

  const openSessionActionMenu = useCallback(
    (sessionId: string) => {
      showActionSheet({
        title: '会话操作',
        message: '请选择操作',
        cancelButtonTitle: '取消',
        style: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
        options: [
          {
            title: '删除会话',
            destructive: true,
            onPress: () => deleteSession(sessionId),
          },
        ],
      });
    },
    [deleteSession, showActionSheet]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '智能问答',
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable onPress={createNewConversation} hitSlop={10} style={styles.headerButton}>
            <MaterialIcons name='add-comment' size={22} color={textColor} />
          </Pressable>
          <Pressable onPress={openHistorySheet} hitSlop={10} style={styles.headerButton}>
            <MaterialIcons name='history' size={22} color={textColor} />
          </Pressable>
        </View>
      ),
    });
  }, [createNewConversation, navigation, openHistorySheet, textColor]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (!activeSession?.id || !newMessages.length) return;
      setHistorySheetVisible(false);

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
        const answerParts = [data.answer]//, data.sources.length ? `\n\n参考依据：\n- ${data.sources.join('\n- ')}` : '']
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
            renderChatEmpty={() => (
              <View style={styles.emptyStateWrap}>
                <Text style={[styles.emptyStateText, { color: mutedColor }]}>在下方提问</Text>
              </View>
            )}
            renderSend={(props) => (
              <Send {...props}>
                <Text style={[styles.sendText, { color: primaryColor }]}>发送</Text>
              </Send>
            )}
            listProps={{
              style: styles.chatList,
              maintainVisibleContentPosition: {
                minIndexForVisible: 0,
              },
            }}
          />

          {Platform.OS === 'android' ? <AvoidKeyboard offset={0} /> : null}
        </View>

        <BottomSheet
          isVisible={historySheetVisible}
          onClose={closeHistorySheet}
          title='历史会话列表'
          snapPoints={[0.75]}
          disablePanGesture
        >
          <View style={styles.historyList}>
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;

              return (
                <Card
                  key={session.id}
                  style={{
                    ...styles.sessionCard,
                    borderColor,
                    borderWidth: StyleSheet.hairlineWidth,
                    backgroundColor: isActive ? primaryColor : cardColor,
                  }}
                >
                  <View style={styles.sessionRow}>
                    <Pressable style={styles.sessionMain} onPress={() => selectSession(session.id)}>
                      <Text
                        style={[styles.historyTitle, { color: isActive ? '#FFFFFF' : textColor }]}
                        numberOfLines={1}
                      >
                        {session.title}
                      </Text>
                      <Text style={[styles.historyMeta, { color: isActive ? '#E5E7EB' : mutedColor }]}>
                        {new Date(session.updatedAt).toLocaleString()}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.sessionMenuButton}
                      onPress={() => openSessionActionMenu(session.id)}
                      hitSlop={10}
                    >
                      <MaterialIcons name='more-vert' size={20} color={isActive ? '#FFFFFF' : textColor} />
                    </Pressable>
                  </View>
                </Card>
              );
            })}
          </View>
        </BottomSheet>

        {SessionActionSheet}

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
  },
  chatList: {
    minWidth: 0,
  },
  emptyStateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    transform: [{ scale: -1 }],
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sendText: {
    fontSize: 15,
    fontWeight: '600',
    marginHorizontal: 10,
    marginBottom: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
    gap: 10,
  },
  headerButton: {
    padding: 2,
  },
  historyList: {
    gap: 10,
  },
  sessionCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionMain: {
    flex: 1,
    gap: 2,
  },
  sessionMenuButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidSpacer: {
    height: 0,
  },
});
