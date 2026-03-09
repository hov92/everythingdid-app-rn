import { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
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
import { fetchTeaPosts, TeaPost } from '../../../lib/tea-api';

export default function TeaProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id ?? 0);

  const postsQuery = useQuery({
    queryKey: ['tea-profile-posts', userId],
    queryFn: () => fetchTeaPosts({ userId, feed: 'profile' }),
    enabled: !!userId,
  });

  const profileName = useMemo(() => {
    const first = postsQuery.data?.[0]?.author;
    return first || `User ${userId}`;
  }, [postsQuery.data, userId]);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={postsQuery.data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/tea/post/${item.id}`)}
          >
            <Text style={styles.cardText} numberOfLines={4}>
              {item.content}
            </Text>
          </Pressable>
        )}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>

            <View style={styles.profileCard}>
              <View style={styles.avatar} />
              <Text style={styles.name}>{profileName}</Text>
              <Text style={styles.handle}>@{String(profileName).toLowerCase().replace(/\s+/g, '')}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{postsQuery.data?.length ?? 0}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>0</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>0</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>

              <Pressable style={styles.followBtn}>
                <Text style={styles.followBtnText}>Follow</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          postsQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator />
            </View>
          ) : postsQuery.isError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Could not load profile</Text>
              <Text style={styles.emptyText}>
                {(postsQuery.error as Error)?.message || 'Try again.'}
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>This user hasn’t posted yet.</Text>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f6f7' },
  listContent: { paddingBottom: 28 },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
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
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  name: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  handle: {
    marginTop: 4,
    fontSize: 14,
    color: '#777',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
  },
  followBtn: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  followBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 16,
  },
  cardText: {
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