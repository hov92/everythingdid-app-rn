import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewToken,
} from 'react-native';
import {
  deleteTeaPost,
  fetchTeaPosts,
  TeaPost,
  toggleTeaFavorite,
} from '../../lib/tea-api';
import { useAuthStore } from '../../store/auth-store';
import TeaShellHeader from '../../../src/components/tea/TeaShellHeader';
import TeaHomeSubTabs from '../../../src/components/tea/TeaHomeSubTabs';
import TeaFollowButton from '../../../src/components/tea/TeaFollowButton';
import TeaPostMenu from '../../../src/components/tea/TeaPostMenu';
import TeaShareSheet from '../../../src/components/tea/TeaShareSheet';

const STORY_PLACEHOLDERS = [
  { id: 's1', label: 'Rey' },
  { id: 's2', label: 'Hair' },
  { id: 's3', label: 'Makeup' },
  { id: 's4', label: 'Nails' },
  { id: 's5', label: 'Barbers' },
];

const VIDEO_PLACEHOLDER =
  'https://everythingdid.com/wp-content/plugins/buddyboss-platform/bp-templates/bp-nouveau/images/video-placeholder.jpg';

function formatTime(value: string) {
  if (!value) return 'Now';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function AutoPlayFeedVideo({
  uri,
  videoId,
  soundOnVideoId,
  setSoundOnVideoId,
}: {
  uri: string;
  videoId: number;
  soundOnVideoId: number | null;
  setSoundOnVideoId: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const muted = soundOnVideoId !== videoId;

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    player.muted = muted;
    player.play();
  }, [player, muted]);

  return (
    <Pressable
      onPress={() =>
        setSoundOnVideoId((current) => (current === videoId ? null : videoId))
      }
    >
      <VideoView
        player={player}
        style={styles.cardImage}
        nativeControls={false}
        contentFit="cover"
      />
      <View style={styles.soundBadge}>
        <Text style={styles.soundBadgeText}>
          {muted ? '🔇 Tap for sound' : '🔊 Sound on'}
        </Text>
      </View>
    </Pressable>
  );
}

const TeaFeedCard = React.memo(function TeaFeedCard({
  item,
  token,
  currentUserId,
  onLike,
  onDeletePost,
  onSharePost,
  liking,
  isActiveVideo,
  soundOnVideoId,
  setSoundOnVideoId,
}: {
  item: TeaPost;
  token: string | null;
  currentUserId?: number | null;
  onLike: () => void;
  onDeletePost: () => void;
  onSharePost: () => void;
  liking: boolean;
  isActiveVideo: boolean;
  soundOnVideoId: number | null;
  setSoundOnVideoId: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const hasImage = !!item.imageUrls?.length;
  const hasVideo = !!item.videoAttachmentIds?.length;
  const hasText = !!item.content?.trim();
  const isOwner =
    !!currentUserId &&
    !!item.authorId &&
    Number(currentUserId) === Number(item.authorId);

  const videoPoster =
    item.edVideoPosterUrl || item.videoPosterUrls?.[0] || VIDEO_PLACEHOLDER;
  const videoUri = item.videoUrls?.[0];

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/tea/post/${item.id}`)}
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

        {isOwner ? (
          <TeaPostMenu
            isOwner
            onEdit={() => router.push(`/tea/post/${item.id}`)}
            onDelete={onDeletePost}
            onShare={onSharePost}
          />
        ) : (
          <TeaFollowButton
            authorId={item.authorId}
            currentUserId={currentUserId}
          />
        )}
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
          {isActiveVideo && videoUri ? (
            <AutoPlayFeedVideo
              uri={videoUri}
              videoId={item.id}
              soundOnVideoId={soundOnVideoId}
              setSoundOnVideoId={setSoundOnVideoId}
            />
          ) : (
            <>
              <Image
                source={{ uri: videoPoster }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.videoBadge}>
                <Text style={styles.videoBadgeText}>▶ Video</Text>
              </View>
            </>
          )}
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
            router.push(`/tea/post/${item.id}`);
          }}
          style={styles.actionPill}
        >
          <Text style={styles.actionPillText}>💬 {item.commentCount}</Text>
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onSharePost();
          }}
          style={styles.actionPill}
        >
          <Text style={styles.actionPillText}>↻ Share</Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

export default function TeaHomeScreen() {
  const [search, setSearch] = useState('');
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
  const [soundOnVideoId, setSoundOnVideoId] = useState<number | null>(null);
  const [sharePost, setSharePost] = useState<TeaPost | null>(null);

  const token = useAuthStore((s) => s.token);
  const currentUserId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ['tea-posts', 'for-you', search, 'autoplay'],
    queryFn: () =>
      fetchTeaPosts({
        search,
        feed: 'for-you',
        includeVideoUrls: true,
      }),
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

  const deletePostMutation = useMutation({
    mutationFn: (activityId: number) => deleteTeaPost(activityId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tea-posts'] });
      await queryClient.invalidateQueries({ queryKey: ['tea-post'] });
    },
    onError: (e: any) => {
      Alert.alert('Delete failed', e?.message || 'Could not delete post.');
    },
  });

  const handleLike = useCallback(
    (item: TeaPost) => {
      if (!token) {
        router.push('/login');
        return;
      }

      favoriteMutation.mutate({
        activityId: item.id,
        favorite: !item.viewerHasLiked,
      });
    },
    [token, favoriteMutation]
  );

  const handleDeletePost = useCallback(
    (item: TeaPost) => {
      Alert.alert(
        'Delete post',
        'Are you sure you want to delete this post?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deletePostMutation.mutate(item.id),
          },
        ]
      );
    },
    [deletePostMutation]
  );

  const handleSharePost = useCallback((item: TeaPost) => {
    setSharePost(item);
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisibleVideo = viewableItems.find((viewable) => {
        const item = viewable.item as TeaPost | undefined;
        return !!item?.videoAttachmentIds?.length;
      });

      setActiveVideoId(
        firstVisibleVideo ? Number((firstVisibleVideo.item as TeaPost).id) : null
      );
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
    minimumViewTime: 250,
  }).current;

  const renderItem = useCallback(
    ({ item }: { item: TeaPost }) => (
      <TeaFeedCard
        item={item}
        token={token}
        currentUserId={currentUserId}
        liking={
          favoriteMutation.isPending &&
          favoriteMutation.variables?.activityId === item.id
        }
        onLike={() => handleLike(item)}
        onDeletePost={() => handleDeletePost(item)}
        onSharePost={() => handleSharePost(item)}
        isActiveVideo={activeVideoId === item.id}
        soundOnVideoId={soundOnVideoId}
        setSoundOnVideoId={setSoundOnVideoId}
      />
    ),
    [
      token,
      currentUserId,
      handleLike,
      handleDeletePost,
      handleSharePost,
      favoriteMutation.isPending,
      favoriteMutation.variables?.activityId,
      activeVideoId,
      soundOnVideoId,
    ]
  );

  const header = useMemo(
    () => (
      <View>
        <TeaShellHeader title="Tea" />

        <View style={styles.headerWrap}>
          <TeaHomeSubTabs active="for-you" />

          <View style={styles.topRow}>
            <View />
            <View style={styles.topActions}>
              <Pressable
                onPress={() => router.push('/tea/explore')}
                style={styles.iconBtn}
              >
                <Text style={styles.iconBtnText}>⌕</Text>
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
        </View>
      </View>
    ),
    [search]
  );

  useEffect(() => {
    if (soundOnVideoId && soundOnVideoId !== activeVideoId) {
      setSoundOnVideoId(null);
    }
  }, [activeVideoId, soundOnVideoId]);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={postsQuery.data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews
        updateCellsBatchingPeriod={50}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
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

      <TeaShareSheet
        visible={!!sharePost}
        onClose={() => setSharePost(null)}
        activityId={sharePost?.id ?? 0}
        author={sharePost?.author}
        content={sharePost?.content}
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
    paddingTop: 0,
    paddingBottom: 10,
    backgroundColor: '#f6f6f7',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 14,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  soundBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  soundBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});