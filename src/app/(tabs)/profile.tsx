import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchSubscribedThreads, fetchTopicsByIds, SimpleTopicRow } from '../../lib/api';
import { useAuthStore } from '../../store/auth-store';
import { useSavedThreadsStore } from '../../store/saved-threads-store';

export default function ProfileScreen() {
  const token = useAuthStore((s) => s.token);
  const username = useAuthStore((s) => s.username);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const savedIds = useSavedThreadsStore((s) => s.savedIds);

  const loggedIn = !!token;

  const subscribedQuery = useQuery({
    queryKey: ['subscribed-threads', !!token],
    queryFn: fetchSubscribedThreads,
    enabled: !!token,
  });

  const savedQuery = useQuery({
    queryKey: ['saved-threads', savedIds],
    queryFn: () => fetchTopicsByIds(savedIds),
  });

  async function handleLogout() {
    await clearAuth();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={[]}
        keyExtractor={(_, i) => String(i)}
        ListHeaderComponent={
          <View style={styles.wrap}>
            <View style={styles.hero}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {username?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>

              <Text style={styles.title}>
                {loggedIn ? username || 'Logged in' : 'Guest'}
              </Text>

              <View style={[styles.badge, loggedIn ? styles.badgeOn : styles.badgeOff]}>
                <View style={[styles.dot, loggedIn ? styles.dotOn : styles.dotOff]} />
                <Text style={[styles.badgeText, loggedIn ? styles.badgeTextOn : styles.badgeTextOff]}>
                  {loggedIn ? 'Logged in' : 'Logged out'}
                </Text>
              </View>
            </View>

            {!loggedIn ? (
              <Pressable style={styles.primaryBtn} onPress={() => router.push('/login')}>
                <Text style={styles.primaryBtnText}>Log in</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Log out</Text>
              </Pressable>
            )}

            <Section
              title="Saved"
              loading={savedQuery.isLoading}
              emptyText="No saved threads yet."
              items={savedQuery.data ?? []}
            />

            <Section
              title="Following"
              loading={subscribedQuery.isLoading}
emptyText={loggedIn ? 'You are not following any threads yet.' : 'Log in to see followed threads.'}              items={subscribedQuery.data ?? []}
            />
          </View>
        }
        renderItem={null}
      />
    </SafeAreaView>
  );
}

function Section({
  title,
  items,
  loading,
  emptyText,
}: {
  title: string;
  items: SimpleTopicRow[];
  loading: boolean;
  emptyText: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
        </View>
      ) : items.length ? (
        <View style={styles.list}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={styles.threadRow}
              onPress={() => router.push(`/thread/${item.id}`)}
            >
              <Text style={styles.threadTitle} numberOfLines={2}>
                {item.title}
              </Text>

              <Text style={styles.threadMeta} numberOfLines={1}>
                {item.author} • {item.replyCount} replies
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.cardText}>{emptyText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f6f7',
  },
  wrap: {
    padding: 20,
    gap: 16,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ececf1',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
  },
  badge: {
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeOn: {
    backgroundColor: '#e9f8ee',
  },
  badgeOff: {
    backgroundColor: '#f1f1f4',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  dotOn: {
    backgroundColor: '#18a957',
  },
  dotOff: {
    backgroundColor: '#888',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeTextOn: {
    color: '#146c3b',
  },
  badgeTextOff: {
    color: '#555',
  },
  primaryBtn: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#ececf1',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ececf1',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#555',
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  list: {
    gap: 10,
  },
  threadRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f3',
  },
  threadTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#222',
  },
  threadMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
  },
});