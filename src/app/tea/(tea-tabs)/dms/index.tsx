import React from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import TeaShellHeader from '../../../../components/tea/TeaShellHeader';
import { DmThread, fetchDmThreads } from '../../../../lib/tea-api';
import { useAuthStore } from '../../../../store/auth-store';

function formatThreadTime(value?: string) {
  if (!value) return '';

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function ThreadRow({ item }: { item: DmThread }) {
  const firstRecipient = item.recipients?.[0];
  const avatar = firstRecipient?.avatar || '';
  const name =
    item.recipients?.map((r) => r.name).filter(Boolean).join(', ') ||
    'Conversation';

  return (
    <Pressable
      style={styles.threadCard}
      onPress={() => router.push(`/tea/dms/${item.id}`)}
    >
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar} />
      )}

      <View style={styles.threadMain}>
        <View style={styles.threadTopRow}>
          <Text style={styles.threadName} numberOfLines={1}>
            {name}
          </Text>

          {!!item.updatedAt && (
            <Text style={styles.threadTime}>
              {formatThreadTime(item.updatedAt)}
            </Text>
          )}
        </View>

        <Text style={styles.threadExcerpt} numberOfLines={2}>
          {item.excerpt?.trim() || 'Open conversation'}
        </Text>
      </View>

      {!!item.unreadCount ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function TeaDmInboxScreen() {
  const token = useAuthStore((s) => s.token);

  const threadsQuery = useQuery({
    queryKey: ['tea-dm-threads'],
    queryFn: fetchDmThreads,
    enabled: !!token,
  });

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={token ? threadsQuery.data ?? [] : []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ThreadRow item={item} />}
        ListHeaderComponent={
          <View>
            <TeaShellHeader title="DMs" />

            <View style={styles.headerWrap}>
              <View style={styles.topRow}>
                <Text style={styles.title}>Messages</Text>

                <Pressable
                  onPress={() => router.push('/tea/dms/new')}
                  style={styles.newBtn}
                >
                  <Text style={styles.newBtnText}>New</Text>
                </Pressable>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          !token ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Log in to use DMs</Text>
              <Pressable
                onPress={() => router.push('/login')}
                style={styles.loginBtn}
              >
                <Text style={styles.loginBtnText}>Log In</Text>
              </Pressable>
            </View>
          ) : threadsQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator />
            </View>
          ) : threadsQuery.isError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Could not load messages</Text>
              <Text style={styles.emptyText}>
                {(threadsQuery.error as Error)?.message || 'Try again.'}
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>
                Start a conversation from the New button.
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          token ? (
            <RefreshControl
              refreshing={threadsQuery.isRefetching && !threadsQuery.isLoading}
              onRefresh={() => threadsQuery.refetch()}
            />
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f6f7',
  },
  listContent: {
    paddingBottom: 28,
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#f6f6f7',
  },
  topRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },
  newBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  newBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  threadCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  threadMain: {
    flex: 1,
  },
  threadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  threadName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
  },
  threadTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#777',
  },
  threadExcerpt: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#666',
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 7,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  centerState: {
    paddingTop: 40,
    alignItems: 'center',
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
  loginBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});