import React, { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  DmRecipient,
  searchDmRecipients,
  searchExistingDmThread,
  sendNewDm,
} from '../../../lib/tea-api';
import { useAuthStore } from '../../../store/auth-store';

function RecipientRow({
  item,
  onPress,
}: {
  item: DmRecipient;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.recipientCard} onPress={onPress}>
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar} />
      )}

      <View style={styles.recipientTextWrap}>
        <Text style={styles.recipientName}>{item.name}</Text>
        {!!item.mentionName && (
          <Text style={styles.recipientMeta}>@{item.mentionName}</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function TeaNewDmScreen() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    shareText?: string | string[];
    activityId?: string | string[];
  }>();

  const initialShareText = useMemo(() => {
    const raw = Array.isArray(params.shareText)
      ? params.shareText[0]
      : params.shareText;
    return String(raw ?? '').trim();
  }, [params.shareText]);

  const [term, setTerm] = useState('');
  const [selectedRecipient, setSelectedRecipient] =
    useState<DmRecipient | null>(null);
  const [message, setMessage] = useState(initialShareText);

  useEffect(() => {
    setMessage(initialShareText);
  }, [initialShareText]);

  const trimmedTerm = term.trim();

  const recipientsQuery = useQuery({
    queryKey: ['tea-dm-recipient-search', trimmedTerm],
    queryFn: () => searchDmRecipients(trimmedTerm),
    enabled: !!token && !selectedRecipient && trimmedTerm.length >= 1,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecipient) {
        throw new Error('Choose a recipient first.');
      }

      return sendNewDm({
        recipientIds: [selectedRecipient.id],
        subject: '',
        message: message.trim(),
      });
    },
    onSuccess: async (result: any) => {
      await queryClient.invalidateQueries({ queryKey: ['tea-dm-threads'] });

      const threadId = Number(result?.id ?? result?.thread_id ?? 0);

      if (threadId) {
        router.replace(`/tea/dms/${threadId}`);
        return;
      }

      const existing = await searchExistingDmThread(
        selectedRecipient!.id
      ).catch(() => null);

      const fallbackThreadId = Number(
        existing?.id ?? existing?.thread_id ?? existing?.thread?.id ?? 0
      );

      if (fallbackThreadId) {
        router.replace(`/tea/dms/${fallbackThreadId}`);
      } else {
        router.back();
      }
    },
    onError: (e: any) => {
      Alert.alert('Message failed', e?.message || 'Could not send message.');
    },
  });

  const canSend =
    !!selectedRecipient &&
    message.trim().length > 0 &&
    !sendMutation.isPending;

  const results = useMemo(
    () => recipientsQuery.data ?? [],
    [recipientsQuery.data]
  );

  async function handleSelectRecipient(recipient: DmRecipient) {
    try {
      const existing = await searchExistingDmThread(recipient.id).catch(
        () => null
      );

      const existingThreadId = Number(
        existing?.id ?? existing?.thread_id ?? existing?.thread?.id ?? 0
      );

      if (existingThreadId) {
        router.replace(`/tea/dms/${existingThreadId}`);
        return;
      }

      setSelectedRecipient(recipient);
      setTerm(recipient.name);
    } catch {
      setSelectedRecipient(recipient);
      setTerm(recipient.name);
    }
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <Text style={styles.title}>Log in to send messages</Text>
          <Pressable
            onPress={() => router.push('/login')}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Log In</Text>
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
        keyboardVerticalOffset={24}
      >
        <View style={styles.headerWrap}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>

          <Text style={styles.title}>New Message</Text>

          <TextInput
            value={term}
            onChangeText={(value) => {
              setTerm(value);

              if (selectedRecipient && value !== selectedRecipient.name) {
                setSelectedRecipient(null);
              }
            }}
            placeholder="Search for a person"
            placeholderTextColor="#8b8b8b"
            style={styles.search}
          />

          {selectedRecipient ? (
            <View style={styles.selectedWrap}>
              <Text style={styles.selectedText}>
                Sending to {selectedRecipient.name}
              </Text>

              <Pressable
                onPress={() => {
                  setSelectedRecipient(null);
                  setTerm('');
                  setMessage(initialShareText);
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Change</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {!selectedRecipient ? (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <RecipientRow
                item={item}
                onPress={() => handleSelectRecipient(item)}
              />
            )}
            ListEmptyComponent={
              trimmedTerm.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Search for someone</Text>
                  <Text style={styles.emptyText}>
                    Find a member to start a DM.
                  </Text>
                </View>
              ) : recipientsQuery.isLoading ? (
                <View style={styles.centerState}>
                  <ActivityIndicator />
                </View>
              ) : recipientsQuery.isError ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Search failed</Text>
                  <Text style={styles.emptyText}>
                    {(recipientsQuery.error as Error)?.message || 'Try again.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No people found</Text>
                  <Text style={styles.emptyText}>Try a different search.</Text>
                </View>
              )
            }
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.composeWrap}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Message</Text>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Write your message..."
              placeholderTextColor="#8b8b8b"
              style={styles.messageInput}
              multiline
              textAlignVertical="top"
            />

            <Pressable
              onPress={() => sendMutation.mutate()}
              style={[styles.primaryBtn, !canSend && styles.disabledBtn]}
              disabled={!canSend}
            >
              <Text style={styles.primaryBtnText}>
                {sendMutation.isPending ? 'Sending...' : 'Send'}
              </Text>
            </Pressable>
          </ScrollView>
        )}
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
    padding: 16,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },
  search: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#e9e9ec',
  },
  selectedWrap: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ececf1',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedText: {
    flex: 1,
    color: '#222',
    fontSize: 14,
    fontWeight: '700',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  clearBtnText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  recipientCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  recipientTextWrap: {
    flex: 1,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
  },
  recipientMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
  },
  composeWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
    flexGrow: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
  },
  messageInput: {
    marginTop: 8,
    minHeight: 180,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ececf1',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111',
    textAlignVertical: 'top',
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});