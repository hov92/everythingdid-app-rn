import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { fetchTeaPosts, TeaPost } from '../../../../lib/tea-api';
import TeaShellHeader from '../../../../../src/components/tea/TeaShellHeader';
import TeaHomeSubTabs from '../../../../../src/components/tea/TeaHomeSubTabs';

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

  React.useEffect(() => {
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
        style={styles.reelVideo}
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
const ReelCard = React.memo(function ReelCard({
  item,
  isActive,
  soundOnVideoId,
  setSoundOnVideoId,
}: {
  item: TeaPost;
  isActive: boolean;
  soundOnVideoId: number | null;
  setSoundOnVideoId: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const poster =
    item.edVideoPosterUrl ||
    item.videoPosterUrls?.[0] ||
    VIDEO_PLACEHOLDER;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/tea/post/${item.id}`)}
    >
      <View style={styles.mediaWrap}>
        {isActive && item.videoUrls?.[0] ? (
  <AutoPlayReel
    uri={item.videoUrls[0]}
    videoId={item.id}
    soundOnVideoId={soundOnVideoId}
    setSoundOnVideoId={setSoundOnVideoId}
  />
) : (
          <>
            <Image
              source={{ uri: poster }}
              style={styles.reelVideo}
              resizeMode="cover"
            />
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>▶ Reel</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.metaWrap}>
        <Text style={styles.author}>{item.author}</Text>
        {!!item.content?.trim() && (
          <Text style={styles.content} numberOfLines={2}>
            {item.content}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

export default function TeaReelsScreen() {
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
  const [soundOnVideoId, setSoundOnVideoId] = useState<number | null>(null);

    React.useEffect(() => {
  if (soundOnVideoId && soundOnVideoId !== activeVideoId) {
    setSoundOnVideoId(null);
  }
}, [activeVideoId, soundOnVideoId]);

  const postsQuery = useQuery({
    queryKey: ['tea-posts', 'reels', 'autoplay'],
    queryFn: () =>
      fetchTeaPosts({
        feed: 'for-you',
        includeVideoUrls: true,
      }),
  });

  const reels = useMemo(
    () => (postsQuery.data ?? []).filter((item) => item.videoAttachmentIds?.length > 0),
    [postsQuery.data]
  );

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
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 250,
  }).current;

  const renderItem = useCallback(
  ({ item }: { item: TeaPost }) => (
    <ReelCard
      item={item}
      isActive={activeVideoId === item.id}
      soundOnVideoId={soundOnVideoId}
      setSoundOnVideoId={setSoundOnVideoId}
    />
  ),
  [activeVideoId, soundOnVideoId]
);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={reels}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
        updateCellsBatchingPeriod={50}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={
          <View>
            <TeaShellHeader title="Tea" />
            <View style={styles.headerPad}>
              <TeaHomeSubTabs active="reels" />
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
              <Text style={styles.emptyTitle}>Could not load reels</Text>
              <Text style={styles.emptyText}>
                {(postsQuery.error as Error)?.message || 'Try again.'}
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No reels yet</Text>
              <Text style={styles.emptyText}>Video posts will appear here.</Text>
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
  screen: {
    flex: 1,
    backgroundColor: '#f6f6f7',
  },
  listContent: {
    paddingBottom: 28,
  },
  headerPad: {
    paddingHorizontal: 16,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ececf1',
    overflow: 'hidden',
  },
  mediaWrap: {
    backgroundColor: '#111',
  },
  reelVideo: {
    width: '100%',
    height: 520,
    backgroundColor: '#111',
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
  metaWrap: {
    padding: 14,
  },
  author: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
  },
  content: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#333',
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