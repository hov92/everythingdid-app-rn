import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchTopicDetail, ReplyRow } from '../../lib/api';

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topicId = Number(id ?? 0);

  const detailQuery = useQuery({
    queryKey: ['thread-detail', topicId],
    queryFn: () => fetchTopicDetail(topicId),
    enabled: !!topicId,
  });

  const detail = detailQuery.data;

  if (detailQuery.isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isError || !detail) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Could not load thread.</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={detail.replies}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ReplyCard item={item} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Pressable onPress={() => router.back()} style={styles.backPill}>
              <Text style={styles.backPillText}>Back</Text>
            </Pressable>

            <View style={styles.opCard}>
              <Text style={styles.title}>{detail.title}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{detail.author}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{formatTime(detail.time)}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{detail.replyCount} replies</Text>
              </View>

              <Text style={styles.content}>{detail.content}</Text>
            </View>

            <Text style={styles.replyHeader}>Replies</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No replies yet</Text>
            <Text style={styles.emptyText}>This thread has no replies yet.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function ReplyCard({ item }: { item: ReplyRow }) {
  return (
    <View style={styles.replyCard}>
      <View style={styles.metaRow}>
        <Text style={styles.metaTextStrong}>{item.author}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>{formatTime(item.time)}</Text>
      </View>

      <Text style={styles.replyText}>{item.text}</Text>
    </View>
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
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
  },
  backBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 28,
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
    marginBottom: 12,
  },
  backPillText: {
    color: '#111',
    fontWeight: '700',
  },
  opCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ececf1',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#161616',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#707070',
    fontWeight: '500',
  },
  metaTextStrong: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
  },
  metaDot: {
    fontSize: 12,
    color: '#a0a0a0',
    marginHorizontal: 6,
  },
  content: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 23,
    color: '#333',
  },
  replyHeader: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  replyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ececf1',
  },
  replyText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: '#333',
  },
  empty: {
    paddingHorizontal: 24,
    paddingTop: 32,
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