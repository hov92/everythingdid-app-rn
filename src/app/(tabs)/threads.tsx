import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  fetchForums,
  fetchTopics,
  fetchSubscribedThreads,
  TopicRow,
  votePost,
} from '../../lib/api';
import { useAuthStore } from '../../store/auth-store';
import { useSavedThreadsStore } from '../../store/saved-threads-store';

type SortType = 'latest' | 'trending' | 'following';

export default function ThreadsScreen() {
  const [sort, setSort] = useState<SortType>('latest');
  const [search, setSearch] = useState('');
  const [selectedForumId, setSelectedForumId] = useState<number | null>(null);

  const token = useAuthStore((s) => s.token);
  const username = useAuthStore((s) => s.username);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const queryClient = useQueryClient();

  async function refreshThreadLists() {
    await queryClient.invalidateQueries({ queryKey: ['topics'] });
    await queryClient.invalidateQueries({ queryKey: ['following-topics'] });
    await queryClient.invalidateQueries({ queryKey: ['saved-threads'] });
    await queryClient.invalidateQueries({ queryKey: ['subscribed-threads'] });
  }

  const topicVoteMutation = useMutation({
    mutationFn: ({
      postId,
      direction,
    }: {
      postId: number;
      direction: 'up' | 'remove';
    }) => votePost({ postId, direction }),
    onSuccess: async () => {
      await refreshThreadLists();
    },
  });

  const forumsQuery = useQuery({
    queryKey: ['forums'],
    queryFn: fetchForums,
  });

  const topicsQuery = useQuery({
    queryKey: ['topics', selectedForumId, search, sort],
    queryFn: () =>
      fetchTopics({
        forumId: sort === 'following' ? null : selectedForumId,
        search: sort === 'following' ? '' : search.trim(),
        sort: sort === 'trending' ? 'trending' : 'latest',
      }),
    enabled: sort !== 'following',
  });

  const followingQuery = useQuery({
    queryKey: ['following-topics', !!token],
    queryFn: fetchSubscribedThreads,
    enabled: !!token && sort === 'following',
  });

  const forums = forumsQuery.data ?? [];
  const topics =
    sort === 'following'
      ? ((followingQuery.data ?? []) as TopicRow[])
      : (topicsQuery.data ?? []);

  const isLoading =
    sort === 'following' ? followingQuery.isLoading : topicsQuery.isLoading;

  const header = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Threads</Text>

          <View style={styles.topActions}>
            {token ? (
              <Pressable style={styles.loggedInBadge} onPress={() => clearAuth()}>
                <View style={styles.onlineDot} />
                <Text style={styles.loggedInBadgeText}>
                  {username ? `Logged in as ${username}` : 'Logged in'}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.loginBtn}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.loginBtnText}>Log in</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.newBtn}
              onPress={() => router.push('/thread/new')}
            >
              <Text style={styles.newBtnText}>New</Text>
            </Pressable>
          </View>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={
            sort === 'following'
              ? 'Following feed ignores search'
              : 'Search discussions'
          }
          placeholderTextColor="#8b8b8b"
          style={[
            styles.search,
            sort === 'following' && styles.searchDisabled,
          ]}
          editable={sort !== 'following'}
        />

        <View style={styles.sortRow}>
          <SortPill
            label="Latest"
            active={sort === 'latest'}
            onPress={() => setSort('latest')}
          />
          <SortPill
            label="Trending"
            active={sort === 'trending'}
            onPress={() => setSort('trending')}
          />
          <SortPill
            label="Following"
            active={sort === 'following'}
            onPress={() => setSort('following')}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <ForumChip
            label="All"
            active={selectedForumId === null}
            onPress={() => setSelectedForumId(null)}
            disabled={sort === 'following'}
          />

          {forums.map((forum) => (
            <ForumChip
              key={forum.id}
              label={forum.title}
              active={selectedForumId === forum.id}
              onPress={() => setSelectedForumId(forum.id)}
              disabled={sort === 'following'}
            />
          ))}
        </ScrollView>

        {sort === 'following' ? (
          <Text style={styles.helperText}>
            Showing threads you’re following.
          </Text>
        ) : null}
      </View>
    ),
    [forums, search, selectedForumId, sort, token, username, clearAuth]
  );

  return (
    <SafeAreaView style={styles.screen}>
      {isLoading && !topics.length ? (
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ThreadCard
              item={item}
              token={token}
              voting={
                topicVoteMutation.isPending &&
                topicVoteMutation.variables?.postId === item.id
              }
              onVote={(topic) =>
                topicVoteMutation.mutate({
                  postId: topic.id,
                  direction: topic.viewerHasVoted ? 'remove' : 'up',
                })
              }
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {sort === 'following' ? 'No followed threads yet' : 'No threads found'}
              </Text>
              <Text style={styles.emptyText}>
                {sort === 'following'
                  ? token
                    ? 'Subscribe to threads to see them here.'
                    : 'Log in to view followed threads.'
                  : 'Try another search or category.'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

function SortPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.sortPill, active && styles.sortPillActive]}
    >
      <Text style={[styles.sortPillText, active && styles.sortPillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ForumChip({
  label,
  active,
  onPress,
  disabled = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        active && styles.chipActive,
        disabled && styles.chipDisabled,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          active && styles.chipTextActive,
          disabled && styles.chipTextDisabled,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ThreadCard({
  item,
  token,
  onVote,
  voting,
}: {
  item: TopicRow;
  token: string | null;
  onVote: (item: TopicRow) => void;
  voting: boolean;
}) {
  const isSaved = useSavedThreadsStore((s) => s.isSaved(item.id));
  const toggleSaved = useSavedThreadsStore((s) => s.toggleSaved);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/thread/${item.id}`)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{item.title}</Text>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            toggleSaved(item.id);
          }}
          style={[styles.saveChip, isSaved && styles.saveChipActive]}
        >
          <Text
            style={[styles.saveChipText, isSaved && styles.saveChipTextActive]}
          >
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </Pressable>
      </View>

      {!!item.excerpt && (
        <Text style={styles.cardExcerpt} numberOfLines={3}>
          {item.excerpt}
        </Text>
      )}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{item.author}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>{formatTime(item.time)}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>{item.replyCount} replies</Text>
      </View>

      <View style={styles.cardFooterRow}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();

            if (!token) {
              router.push('/login');
              return;
            }

            onVote(item);
          }}
          style={[
            styles.voteChip,
            item.viewerHasVoted && styles.voteChipActive,
          ]}
        >
          <Text
            style={[
              styles.voteChipText,
              item.viewerHasVoted && styles.voteChipTextActive,
            ]}
          >
            {voting ? 'Saving...' : `▲ ${item.voteCount ?? 0}`}
          </Text>
        </Pressable>
      </View>
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
  screen: {
    flex: 1,
    backgroundColor: '#f6f6f7',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 28,
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#f6f6f7',
  },
  topRow: {
    marginBottom: 14,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
  },
  newBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  newBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  loginBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  loginBtnText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
  },
  loggedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#e9f8ee',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#18a957',
  },
  loggedInBadgeText: {
    color: '#146c3b',
    fontSize: 13,
    fontWeight: '700',
  },
  search: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e9e9ec',
  },
  searchDisabled: {
    opacity: 0.55,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  sortPillActive: {
    backgroundColor: '#111',
  },
  sortPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  sortPillTextActive: {
    color: '#fff',
  },
  chipsRow: {
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6e6eb',
  },
  chipActive: {
    backgroundColor: '#ebe9ff',
    borderColor: '#7c6cff',
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    maxWidth: 140,
  },
  chipTextActive: {
    color: '#5b49f5',
  },
  chipTextDisabled: {
    color: '#777',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ececf1',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: '#161616',
  },
  saveChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f1f1f4',
  },
  saveChipActive: {
    backgroundColor: '#ebe9ff',
  },
  saveChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
  },
  saveChipTextActive: {
    color: '#5b49f5',
  },
  cardExcerpt: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#707070',
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 12,
    color: '#a0a0a0',
    marginHorizontal: 6,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  voteChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f1f1f4',
  },
  voteChipActive: {
    backgroundColor: '#ebe9ff',
  },
  voteChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
  },
  voteChipTextActive: {
    color: '#5b49f5',
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