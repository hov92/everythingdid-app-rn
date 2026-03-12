import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchTeaPosts, TeaPost } from '../../lib/tea-api';

const TAGS = ['#hair', '#makeup', '#nails', '#barber', '#install', '#braids'];

export default function TeaExploreScreen() {
  const [search, setSearch] = useState('');

  const postsQuery = useQuery({
    queryKey: ['tea-posts', 'explore', search],
    queryFn: () => fetchTeaPosts({ search, feed: 'explore' }),
  });

  const header = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Explore</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search users, hashtags, tea..."
          placeholderTextColor="#8b8b8b"
          style={styles.search}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsRow}
        >
          {TAGS.map((tag) => (
            <Pressable
              key={tag}
              style={styles.tagPill}
              onPress={() => setSearch(tag.replace('#', ''))}
            >
              <Text style={styles.tagPillText}>{tag}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    ),
    [search]
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={postsQuery.data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ExploreCard item={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          postsQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator />
            </View>
          ) : postsQuery.isError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Could not load explore</Text>
              <Text style={styles.emptyText}>
                {(postsQuery.error as Error)?.message || 'Try again.'}
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptyText}>Try another search.</Text>
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

function ExploreCard({ item }: { item: TeaPost }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/tea/post/${item.id}`)}
    >
      <Text style={styles.author}>{item.author}</Text>
      <Text style={styles.content} numberOfLines={3}>
        {item.content}
      </Text>
    </Pressable>
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
  search: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e9e9ec',
  },
  tagsRow: {
    gap: 8,
    paddingTop: 12,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  tagPillText: {
    color: '#555',
    fontWeight: '700',
    fontSize: 12,
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
  content: {
    marginTop: 10,
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
  fab: {
  position: 'absolute',
  right: 20,
  bottom: 50,
  width: 60,
  height: 60,
  borderRadius: 999,
  backgroundColor: '#111',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.18,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
},
fabText: {
  color: '#fff',
  fontSize: 30,
  fontWeight: '800',
  lineHeight: 32,
},
});