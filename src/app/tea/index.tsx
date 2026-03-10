import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchTeaPosts, TeaPost, toggleTeaFavorite } from '../../lib/tea-api';
import { useAuthStore } from '../../store/auth-store';

const STORY_PLACEHOLDERS = [
  { id: 's1', label: 'Rey' },
  { id: 's2', label: 'Hair' },
  { id: 's3', label: 'Makeup' },
  { id: 's4', label: 'Nails' },
  { id: 's5', label: 'Barbers' },
];

export default function TeaHomeScreen() {
  const [search, setSearch] = useState('');
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ['tea-posts', 'for-you', search],
    queryFn: () => fetchTeaPosts({ search, feed: 'for-you' }),
  });

  const favoriteMutation = useMutation({
    mutationFn: ({
      activityId,
      favorite,
    }: {
      activityId: number;
      favorite: boolean;
    }) => toggleTeaFavorite({ activityId, favorite }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tea-posts'] });
      await queryClient.invalidateQueries({ queryKey: ['tea-post'] });
    },
  });

  const header = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Tea</Text>

          <View style={styles.topActions}>
            <Pressable
              onPress={() => router.push('/tea/explore')}
              style={styles.iconBtn}
            >
              <Text style={styles.iconBtnText}>⌕</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/tea/create')}
              style={styles.newBtn}
            >
              <Text style={styles.newBtnText}>New</Text>
            </Pressable>
          </View>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search tea posts"
          placeholderTextColor="#8b8b8b"
          style={styles.search}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesRow}
        >
          {STORY_PLACEHOLDERS.map((story) => (
            <View key={story.id} style={styles.storyItem}>
              <View style={styles.storyRing}>
                <View style={styles.storyInner} />
              </View>
              <Text style={styles.storyLabel} numberOfLines={1}>
                {story.label}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.tabsRow}>
          <Pressable style={[styles.tabPill, styles.tabPillActive]}>
            <Text style={[styles.tabPillText, styles.tabPillTextActive]}>
              For You
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabPill}
            onPress={() => router.push('/tea/following')}
          >
            <Text style={styles.tabPillText}>Following</Text>
          </Pressable>

          <Pressable
            style={styles.tabPill}
            onPress={() => router.push('/tea/explore')}
          >
            <Text style={styles.tabPillText}>Explore</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/tea/create')}
          style={styles.quickCompose}
        >
          <View style={styles.quickAvatar} />
          <Text style={styles.quickComposeText}>Share some tea...</Text>
        </Pressable>
      </View>
    ),
    [search]
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={postsQuery.data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TeaFeedCard
            item={item}
            token={token}
            liking={
              favoriteMutation.isPending &&
              favoriteMutation.variables?.activityId === item.id
            }
            onLike={() => {
              if (!token) {
                router.push('/login');
                return;
              }

              favoriteMutation.mutate({
                activityId: item.id,
                favorite: !item.viewerHasLiked,
              });
            }}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          postsQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator />
            </View>
          ) : postsQuery.isError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Could not load tea</Text>
              <Text style={styles.emptyText}>
                {(postsQuery.error as Error)?.message || 'Try again.'}
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No tea yet</Text>
              <Text style={styles.emptyText}>Start the conversation.</Text>
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

function TeaFeedCard({
  item,
  token,
  onLike,
  liking,
}: {
  item: TeaPost;
  token: string | null;
  onLike: () => void;
  liking: boolean;
}) {
  const hasImage = !!item.imageUrls?.length;
  const hasVideo = !!item.videoUrls?.length;
  const hasText = !!item.content?.trim();

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/tea/${item.id}`)}
    >
      <View style={styles.cardTopRow}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            if (item.authorId) {
              router.push(`/tea/profile/${item.authorId}`);
            }
          }}
          style={styles.authorRow}
        >
          {item.authorAvatarUrl ? (
            <Image source={{ uri: item.authorAvatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}

          <View style={styles.authorTextWrap}>
            <Text style={styles.authorName}>{item.author}</Text>
            <Text style={styles.metaText}>{formatTime(item.time)}</Text>
          </View>
        </Pressable>

        <Pressable style={styles.followMiniBtn}>
          <Text style={styles.followMiniBtnText}>Follow</Text>
        </Pressable>
      </View>

      {hasText ? (
        <Text
          style={[
            styles.cardContent,
            (hasImage || hasVideo) && styles.cardContentWithMedia,
          ]}
          numberOfLines={hasImage || hasVideo ? 3 : 6}
        >
          {item.content}
        </Text>
      ) : null}

      {hasVideo ? (
        <View style={styles.mediaWrap}>
          <Image
            source={{
              uri:
                item.videoPosterUrls?.[0] ||
                'https://everythingdid.com/wp-content/plugins/buddyboss-platform/bp-templates/bp-nouveau/images/video-placeholder.jpg',
            }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>▶ Video</Text>
          </View>
        </View>
      ) : hasImage ? (
        <View style={styles.mediaWrap}>
          <Image
            source={{ uri: item.imageUrls[0] }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        </View>
      ) : null}

      <View style={styles.cardActions}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            if (!token) {
              router.push('/login');
              return;
            }
            onLike();
          }}
          style={[
            styles.actionPill,
            item.viewerHasLiked && styles.actionPillActive,
          ]}
        >
          <Text
            style={[
              styles.actionPillText,
              item.viewerHasLiked && styles.actionPillTextActive,
            ]}
          >
            {liking ? 'Saving...' : `♥ ${item.favoriteCount ?? 0}`}
          </Text>
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/tea/${item.id}`);
          }}
          style={styles.actionPill}
        >
          <Text style={styles.actionPillText}>💬 {item.commentCount}</Text>
        </Pressable>

        <Pressable style={styles.actionPill}>
          <Text style={styles.actionPillText}>↻ Repost</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: '#ececf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  newBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  newBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  search: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e9e9ec',
  },
  storiesRow: {
    gap: 12,
    paddingTop: 14,
    paddingBottom: 6,
  },
  storyItem: {
    width: 68,
    alignItems: 'center',
  },
  storyRing: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: '#d8d0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInner: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  storyLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
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
  quickCompose: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ececf1',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickAvatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  quickComposeText: {
    color: '#8b8b8b',
    fontSize: 15,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ececf1',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  authorTextWrap: {
    flex: 1,
  },
  authorName: {
    color: '#222',
    fontSize: 15,
    fontWeight: '800',
  },
  metaText: {
    marginTop: 2,
    color: '#777',
    fontSize: 12,
    fontWeight: '500',
  },
  followMiniBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  followMiniBtnText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    marginTop: 12,
    color: '#222',
    fontSize: 16,
    lineHeight: 24,
  },
  cardContentWithMedia: {
    marginBottom: 0,
  },
  mediaWrap: {
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  cardImage: {
    width: '100%',
    height: 320,
    backgroundColor: '#eee',
  },
  videoBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  videoBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f1f4',
  },
  actionPillActive: {
    backgroundColor: '#ffe8ef',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
  },
  actionPillTextActive: {
    color: '#d6336c',
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