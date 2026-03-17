import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  DmMessage,
  fetchDmThread,
  replyToDm,
} from '../../../lib/tea-api';
import { useAuthStore } from '../../../store/auth-store';
import TeaSharedPostPreview from '../../../components/tea/TeaSharedPostPreview';

function formatMessageTime(value?: string) {
  if (!value) return '';

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function extractTeaActivityId(text: string): number | null {
  const match = String(text || '').match(
    /https?:\/\/everythingdid\.com\/news-feed\/\?activity_id=(\d+)/i
  );

  if (!match) return null;

  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function renderLinkedText(text: string, isMine: boolean) {
  const parts = String(text || '').split(/(https?:\/\/[^\s]+)/g);

  return (
    <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
      {parts.map((part, index) => {
        const isUrl = /^https?:\/\/[^\s]+$/i.test(part);

        if (!isUrl) {
          return <Text key={index}>{part}</Text>;
        }

        return (
          <Text
            key={index}
            style={[styles.linkText, isMine && styles.linkTextMine]}
            onPress={() => {
              Linking.openURL(part).catch(() => {});
            }}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

function MessageBubble({
  item,
  isMine,
}: {
  item: DmMessage;
  isMine: boolean;
}) {
  const sharedActivityId = extractTeaActivityId(item.message);

  return (
    <View
      style={[
        styles.messageRow,
        isMine ? styles.messageRowMine : styles.messageRowOther,
      ]}
    >
      {!isMine ? (
        item.senderAvatar ? (
          <Image source={{ uri: item.senderAvatar }} style={styles.messageAvatar} />
        ) : (
          <View style={styles.messageAvatar} />
        )
      ) : null}

      <View
        style={[
          styles.messageBubble,
          isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
        ]}
      >
        {!isMine && !!item.senderName && (
          <Text style={styles.messageSender}>{item.senderName}</Text>
        )}

        {renderLinkedText(item.message, isMine)}

        {sharedActivityId ? (
          <TeaSharedPostPreview activityId={sharedActivityId} />
        ) : null}

        {!!item.date && (
          <Text
            style={[
              styles.messageTime,
              isMine && styles.messageTimeMine,
            ]}
          >
            {formatMessageTime(item.date)}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function TeaDmThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadId = Number(id ?? 0);

  const token = useAuthStore((s) => s.token);
  const currentUserId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  const [message, setMessage] = useState('');

  const threadQuery = useQuery({
    queryKey: ['tea-dm-thread', threadId],
    queryFn: () => fetchDmThread(threadId),
    enabled: !!token && !!threadId,
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      replyToDm({
        threadId,
        message: message.trim(),
      }),
    onSuccess: async () => {
      setMessage('');
      await queryClient.invalidateQueries({
        queryKey: ['tea-dm-thread', threadId],
      });
      await queryClient.invalidateQueries({ queryKey: ['tea-dm-threads'] });
    },
    onError: (e: any) => {
      Alert.alert('Reply failed', e?.message || 'Could not send reply.');
    },
  });

  const thread = threadQuery.data;
  const messages = useMemo(() => thread?.messages ?? [], [thread?.messages]);

  const title =
    thread?.recipients?.map((r: any) => r.name).filter(Boolean).join(', ') ||
    thread?.subject ||
    'Conversation';

  const canSend = message.trim().length > 0 && !replyMutation.isPending;

  if (!token) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <Text style={styles.title}>Log in to use DMs</Text>
          <Pressable onPress={() => router.push('/login')} style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>Log In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (threadQuery.isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (threadQuery.isError || !thread) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <Text style={styles.title}>Could not load conversation</Text>
          <Pressable onPress={() => router.back()} style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={styles.headerWrap}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>

          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <MessageBubble
              item={item}
              isMine={Number(item.senderId ?? 0) === Number(currentUserId ?? 0)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>Send the first message below.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.composerWrap}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Write a message..."
            placeholderTextColor="#8b8b8b"
            style={styles.composerInput}
            multiline
          />

          <Pressable
            onPress={() => replyMutation.mutate()}
            style={[styles.sendBtn, !canSend && styles.disabledBtn]}
            disabled={!canSend}
          >
            <Text style={styles.sendBtnText}>
              {replyMutation.isPending ? 'Sending...' : 'Send'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f6f7',
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#f6f6f7',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
    marginBottom: 12,
  },
  backBtnText: {
    color: '#111',
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 120,
  },
  messageRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: '#111',
    borderBottomRightRadius: 8,
  },
  messageBubbleOther: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ececf1',
    borderBottomLeftRadius: 8,
  },
  messageSender: {
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '800',
    color: '#555',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#222',
  },
  messageTextMine: {
    color: '#fff',
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#175cd3',
  },
  linkTextMine: {
    color: '#9ec5ff',
  },
  messageTime: {
    marginTop: 6,
    fontSize: 11,
    color: '#777',
    fontWeight: '600',
  },
  messageTimeMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  composerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ececf1',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  composerInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    backgroundColor: '#f3f3f6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
  },
  sendBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.45,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  empty: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});