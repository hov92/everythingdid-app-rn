import { useMemo, useState } from 'react';
import { useSavedThreadsStore } from '../../store/saved-threads-store';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
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
import { fetchForums, fetchTopics, TopicRow } from '../../lib/api';
import { useAuthStore } from '../../store/auth-store';

type SortType = 'latest' | 'trending';

export default function ThreadsScreen() {
  const [sort, setSort] = useState<SortType>('latest');
  const [search, setSearch] = useState('');
  const [selectedForumId, setSelectedForumId] = useState<number | null>(null);

  const token = useAuthStore((s) => s.token);
  const username = useAuthStore((s) => s.username);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const forumsQuery = useQuery({
    queryKey: ['forums'],
    queryFn: fetchForums,
  });

  const topicsQuery = useQuery({
    queryKey: ['topics', selectedForumId, search, sort],
    queryFn: () =>
      fetchTopics({
        forumId: selectedForumId,
        search: search.trim(),
        sort,
      }),
  });

  const forums = forumsQuery.data ?? [];
  const topics = topicsQuery.data ?? [];

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
          placeholder="Search discussions"
          placeholderTextColor="#8b8b8b"
          style={styles.search}
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
          />

          {forums.map((forum) => (
            <ForumChip
              key={forum.id}
              label={forum.title}
              active={selectedForumId === forum.id}
              onPress={() => setSelectedForumId(forum.id)}
            />
          ))}
        </ScrollView>
      </View>
    ),
    [forums, search, selectedForumId, sort, token, username, clearAuth]
  );

  return (
    <SafeAreaView style={styles.screen}>
      {topicsQuery.isLoading && !topics.length ? (
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ThreadCard item={item} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No threads found</Text>
              <Text style={styles.emptyText}>Try another search or category.</Text>
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
    <Pressable onPress={onPress} style={[styles.sortPill, active && styles.sortPillActive]}>
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
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function ThreadCard({ item }: { item: TopicRow }) {
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
          <Text style={[styles.saveChipText, isSaved && styles.saveChipTextActive]}>
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
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    maxWidth: 140,
  },
  chipTextActive: {
    color: '#5b49f5',
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
});