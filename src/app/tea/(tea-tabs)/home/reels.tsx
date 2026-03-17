import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  ActivityIndicator,
  FlatList,
  Image,
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ViewToken,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { fetchTeaPosts, TeaPost } from '../../../../lib/tea-api';

const VIDEO_PLACEHOLDER =
  'https://everythingdid.com/wp-content/plugins/buddyboss-platform/bp-templates/bp-nouveau/images/video-placeholder.jpg';

function AutoPlayReel({
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
      style={StyleSheet.absoluteFill}
      onPress={() =>
        setSoundOnVideoId((current) => (current === videoId ? null : videoId))
      }
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={false}
        contentFit="cover"
      />
    </Pressable>
  );
}

const ReelItem = React.memo(function ReelItem({
  item,
  isActive,
  soundOnVideoId,
  setSoundOnVideoId,
  reelHeight,
}: {
  item: TeaPost;
  isActive: boolean;
  soundOnVideoId: number | null;
  setSoundOnVideoId: React.Dispatch<React.SetStateAction<number | null>>;
  reelHeight: number;
}) {
  const poster =
    item.edVideoPosterUrl ||
    item.videoPosterUrls?.[0] ||
    VIDEO_PLACEHOLDER;

  const muted = soundOnVideoId !== item.id;

  return (
    <Pressable
      style={[styles.reelPage, { height: reelHeight }]}
      onPress={() => router.push(`/tea/post/${item.id}`)}
    >
      <View style={styles.videoLayer}>
        <Image
          source={{ uri: poster }}
          style={[styles.reelVideo, { height: reelHeight }]}
          resizeMode="cover"
        />

        {isActive && item.videoUrls?.[0] ? (
          <AutoPlayReel
            uri={item.videoUrls[0]}
            videoId={item.id}
            soundOnVideoId={soundOnVideoId}
            setSoundOnVideoId={setSoundOnVideoId}
          />
        ) : null}
      </View>

      <View style={styles.topOverlay} pointerEvents="box-none">
        <Pressable onPress={() => router.replace('/')} style={styles.overlayGhostBtn}>
          <Text style={styles.overlayGhostBtnText}>EverythingDid</Text>
        </Pressable>

        <View style={styles.topTabs}>
          <Pressable onPress={() => router.replace('/tea/home')} style={styles.topTab}>
            <Text style={styles.topTabTextMuted}>For You</Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/tea/home/following')} style={styles.topTab}>
            <Text style={styles.topTabTextMuted}>Following</Text>
          </Pressable>

          <View style={[styles.topTab, styles.topTabActive]}>
            <Text style={styles.topTabTextActive}>Reels</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomOverlay} pointerEvents="box-none">
        <View style={styles.leftMeta}>
          <View style={styles.authorRow}>
            {item.authorAvatarUrl ? (
              <Image source={{ uri: item.authorAvatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar} />
            )}

            <Text style={styles.authorName}>{item.author}</Text>

            <Pressable style={styles.followBtn}>
              <Text style={styles.followBtnText}>Follow</Text>
            </Pressable>
          </View>

          {!!item.content?.trim() && (
            <Text style={styles.caption} numberOfLines={2}>
              {item.content}
            </Text>
          )}

          <View style={styles.soundBadge}>
            <Text style={styles.soundBadgeText}>
              {muted ? '🔇 Tap for sound' : '🔊 Sound on'}
            </Text>
          </View>
        </View>

        <View style={styles.rightRail}>
          <Pressable style={styles.railBtn}>
            <Text style={styles.railIcon}>♥</Text>
            <Text style={styles.railText}>{item.favoriteCount ?? 0}</Text>
          </Pressable>

          <Pressable
            style={styles.railBtn}
            onPress={() => router.push(`/tea/post/${item.id}`)}
          >
            <Text style={styles.railIcon}>💬</Text>
            <Text style={styles.railText}>{item.commentCount ?? 0}</Text>
          </Pressable>

          <Pressable style={styles.railBtn}>
            <Text style={styles.railIcon}>↻</Text>
            <Text style={styles.railText}>Repost</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});


export default function TeaReelsScreen() {
  const { height } = useWindowDimensions();
  const [containerHeight, setContainerHeight] = useState(height);
  const tabBarHeight = useBottomTabBarHeight();

  const PAGE_BOTTOM_BUFFER = 8;
  const reelHeight = Math.max(
    0,
    containerHeight - tabBarHeight - PAGE_BOTTOM_BUFFER
  );

  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
  const [soundOnVideoId, setSoundOnVideoId] = useState<number | null>(null);

  useEffect(() => {
    if (soundOnVideoId && soundOnVideoId !== activeVideoId) {
      setSoundOnVideoId(null);
    }
  }, [activeVideoId, soundOnVideoId]);

  function handleLayout(event: LayoutChangeEvent) {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight > 0 && nextHeight !== containerHeight) {
      setContainerHeight(nextHeight);
    }
  }

  const postsQuery = useQuery({
    queryKey: ['tea-posts', 'reels', 'immersive'],
    queryFn: () =>
      fetchTeaPosts({
        feed: 'for-you',
        includeVideoUrls: true,
      }),
  });

  const reels = useMemo(
    () =>
      (postsQuery.data ?? []).filter(
        (item) => item.videoAttachmentIds?.length > 0
      ),
    [postsQuery.data]
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisibleVideo = viewableItems.find((viewable) => {
        const item = viewable.item as TeaPost | undefined;
        return !!item?.videoAttachmentIds?.length;
      });

      setActiveVideoId(
        firstVisibleVideo
          ? Number((firstVisibleVideo.item as TeaPost).id)
          : null
      );
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 85,
    minimumViewTime: 200,
  }).current;

  const renderItem = useCallback(
    ({ item }: { item: TeaPost }) => (
      <ReelItem
        item={item}
        isActive={activeVideoId === item.id}
        soundOnVideoId={soundOnVideoId}
        setSoundOnVideoId={setSoundOnVideoId}
        reelHeight={reelHeight}
      />
    ),
    [activeVideoId, soundOnVideoId, reelHeight]
  );

  return (
    <SafeAreaView style={styles.screen} onLayout={handleLayout}>
      <FlatList
        data={reels}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
        updateCellsBatchingPeriod={50}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToAlignment="start"
        snapToInterval={reelHeight}
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: reelHeight,
          offset: reelHeight * index,
          index,
        })}
        ListEmptyComponent={
          postsQuery.isLoading ? (
            <View style={[styles.emptyWrap, { height: reelHeight }]}>
              <ActivityIndicator />
            </View>
          ) : postsQuery.isError ? (
            <View style={[styles.emptyWrap, { height: reelHeight }]}>
              <Text style={styles.emptyTitle}>Could not load reels</Text>
              <Text style={styles.emptyText}>
                {(postsQuery.error as Error)?.message || 'Try again.'}
              </Text>
            </View>
          ) : (
            <View style={[styles.emptyWrap, { height: reelHeight }]}>
              <Text style={styles.emptyTitle}>No reels yet</Text>
              <Text style={styles.emptyText}>Video posts will appear here.</Text>
            </View>
          )
        }
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
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  reelPage: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  videoLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  reelVideo: {
    width: '100%',
    backgroundColor: '#000',
  },
  topOverlay: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 5,
  },
  overlayGhostBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.35)',
    marginBottom: 12,
  },
  overlayGhostBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  topTabs: {
    flexDirection: 'row',
    gap: 10,
  },
  topTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topTabActive: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  topTabTextMuted: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  topTabTextActive: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 5,
  },
  leftMeta: {
    flex: 1,
    paddingRight: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#2c2c2c',
  },
  authorName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    flexShrink: 1,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  followBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  caption: {
    marginTop: 10,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  soundBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.60)',
  },
  soundBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  rightRail: {
    alignItems: 'center',
    gap: 18,
    marginBottom: 4,
  },
  railBtn: {
    alignItems: 'center',
  },
  railIcon: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  railText: {
    marginTop: 6,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#000',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#d0d0d0',
    textAlign: 'center',
  },
});