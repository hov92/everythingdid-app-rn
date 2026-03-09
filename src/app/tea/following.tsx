import { useMemo } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchTeaPosts, TeaPost } from '../../lib/tea-api';

export default function TeaFollowingScreen() {
  const postsQuery = useQuery({
    queryKey: ['tea-posts', 'following'],
    queryFn: () => fetchTeaPosts({ feed: 'following' }),
  });

  const header = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Following</Text>

        <View style={styles.tabsRow}>
          <Pressable style={styles.tabPill} onPress={() => router.replace('/tea')}>
            <Text style={styles.tabPillText}>For You</Text>
          </Pressable>

          <Pressable style={[styles.tabPill, styles.tabPillActive]}>
            <Text style={[styles.tabPillText, styles.tabPillTextActive]}>
              Following
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabPill}
            onPress={() => router.replace('/tea/explore')}
          >
            <Text style={styles.tabPillText}>Explore</Text>
          </Pressable>
        </View>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={postsQuery.data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <FollowingCard item={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          postsQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator />
            </View>
          ) : postsQuery.isError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Could not load following feed</Text>
              <Text style={styles.emptyText}>
                {(postsQuery.error as Error)?.message || 'Try again.'}
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No following posts yet</Text>
              <Text style={styles.emptyText}>
                Follow people to see their posts here.
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={postsQuery.isRefetching && !postsQuery.isLoading}
            onRefresh={() => postsQuery.refetch()}
          />
        }
      />
    </SafeAreaView>
  );
}

function FollowingCard({ item }: { item: TeaPost }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/tea/post/${item.id}`)}
    >
      <Text style={styles.author}>{item.author}</Text>
      <Text style={styles.meta}>{formatTime(item.time)}</Text>
      <Text style={styles.content} numberOfLines={4}>
        {item.content}
      </Text>
    </Pressable>
  );
}

function formatTime(value: string) {
  if (!value) return 'Now';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f6f7' },
  listContent: { paddingBottom: 28 },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  topRow: {
    marginBottom: 12,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  backBtnText: {
    color: '#111',
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  tabPillActive: {
    backgroundColor: '#111',
  },
  tabPillText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 13,
  },
  tabPillTextActive: {
    color: '#fff',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 16,
  },
  author: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
  },
  content: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#222',
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
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});