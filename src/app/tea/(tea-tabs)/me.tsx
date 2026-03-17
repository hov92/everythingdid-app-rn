import React, { useState } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import TeaShellHeader from '../../../../src/components/tea/TeaShellHeader';
import { fetchTeaPosts, TeaPost, findMyBioField } from '../../../../src/lib/tea-api';
import { useAuthStore } from '../../../../src/store/auth-store';

const VIDEO_PLACEHOLDER =
  'https://everythingdid.com/wp-content/plugins/buddyboss-platform/bp-templates/bp-nouveau/images/video-placeholder.jpg';

type ProfileTabKey = 'all' | 'photos' | 'videos';

export default function TeaProfileTabScreen() {
  const userId = useAuthStore((s) => s.userId);
  const token = useAuthStore((s) => s.token);
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('all');

  const postsQuery = useQuery({
    queryKey: ['tea-posts', 'my-profile', userId],
    queryFn: async () => {
      const results = await fetchTeaPosts({
        feed: 'profile',
        userId: Number(userId),
      });

      return results.filter((post) => {
        return Number(post.authorId ?? 0) === Number(userId ?? 0);
      });
    },
    enabled: !!token && !!userId,
  });

  const rawPosts = postsQuery.data ?? [];

  const filteredPosts = React.useMemo(() => {
    if (activeTab === 'photos') {
      return rawPosts.filter(
        (post) =>
          (post.imageUrls?.length ?? 0) > 0 &&
          (post.videoAttachmentIds?.length ?? 0) === 0
      );
    }

    if (activeTab === 'videos') {
      return rawPosts.filter(
        (post) => (post.videoAttachmentIds?.length ?? 0) > 0
      );
    }

    return rawPosts;
  }, [rawPosts, activeTab]);

  const firstPost = rawPosts[0];
  const profileName = firstPost?.author || 'My Profile';
  const profileAvatar = firstPost?.authorAvatarUrl || '';

  const totalLikes = rawPosts.reduce(
    (sum, post) => sum + Number(post.favoriteCount ?? 0),
    0
  );

  const totalPhotos = rawPosts.filter(
    (post) =>
      (post.imageUrls?.length ?? 0) > 0 &&
      (post.videoAttachmentIds?.length ?? 0) === 0
  ).length;

  const totalVideos = rawPosts.filter(
    (post) => (post.videoAttachmentIds?.length ?? 0) > 0
  ).length;

  const bioFieldQuery = useQuery({
  queryKey: ['tea-me-bio-field', userId],
  queryFn: () => findMyBioField(Number(userId)),
  enabled: !!token && !!userId,
});

const profileBio =
  String(bioFieldQuery.data?.value ?? '').trim() ||
  'Your Tea profile. Posts, videos, and updates all in one place.';

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={token && userId ? filteredPosts : []}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        renderItem={({ item }) => <ProfileGridTile item={item} />}
        ListHeaderComponent={
          <View>
            <TeaShellHeader title="Profile" />

            <View style={styles.headerWrap}>
              {!token || !userId ? (
                <View style={styles.loggedOutCard}>
                  <Text style={styles.loggedOutTitle}>
                    Log in to view your Tea profile
                  </Text>
                  <Pressable
                    onPress={() => router.push('/login')}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>Log In</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.profileTop}>
                    {profileAvatar ? (
                      <Image
                        source={{ uri: profileAvatar }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatar} />
                    )}

                    <View style={styles.profileMeta}>
                      <Text style={styles.name}>{profileName}</Text>
                      <Text style={styles.handle}>@everythingdidtea</Text>

                      <Text style={styles.bio}>{profileBio}</Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{rawPosts.length}</Text>
                      <Text style={styles.statLabel}>Posts</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{totalLikes}</Text>
                      <Text style={styles.statLabel}>Likes</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{totalVideos}</Text>
                      <Text style={styles.statLabel}>Videos</Text>
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <Pressable
  style={styles.secondaryBtn}
  onPress={() => router.push('/tea/profile/edit')}
>
  <Text style={styles.secondaryBtnText}>Edit Profile</Text>
</Pressable>

                    <Pressable style={styles.secondaryBtn}>
                      <Text style={styles.secondaryBtnText}>Share Profile</Text>
                    </Pressable>
                  </View>

                  <View style={styles.sectionTabs}>
                    <Pressable
                      style={[
                        styles.sectionTab,
                        activeTab === 'all' && styles.sectionTabActive,
                      ]}
                      onPress={() => setActiveTab('all')}
                    >
                      <Text
                        style={[
                          styles.sectionTabText,
                          activeTab === 'all' && styles.sectionTabTextActive,
                        ]}
                      >
                        All
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.sectionTab,
                        activeTab === 'photos' && styles.sectionTabActive,
                      ]}
                      onPress={() => setActiveTab('photos')}
                    >
                      <Text
                        style={[
                          styles.sectionTabText,
                          activeTab === 'photos' && styles.sectionTabTextActive,
                        ]}
                      >
                        Photos
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.sectionTab,
                        activeTab === 'videos' && styles.sectionTabActive,
                      ]}
                      onPress={() => setActiveTab('videos')}
                    >
                      <Text
                        style={[
                          styles.sectionTabText,
                          activeTab === 'videos' && styles.sectionTabTextActive,
                        ]}
                      >
                        Videos
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.resultLabel}>
                    {activeTab === 'all'
                      ? `${rawPosts.length} post${rawPosts.length === 1 ? '' : 's'}`
                      : activeTab === 'photos'
                      ? `${totalPhotos} photo post${totalPhotos === 1 ? '' : 's'}`
                      : `${totalVideos} video post${totalVideos === 1 ? '' : 's'}`}
                  </Text>
                </>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          !token || !userId ? null : postsQuery.isLoading ? (
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
              <Text style={styles.emptyTitle}>
                {activeTab === 'all'
                  ? 'No posts yet'
                  : activeTab === 'photos'
                  ? 'No photos yet'
                  : 'No videos yet'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'all'
                  ? 'Create your first Tea post to start your profile.'
                  : activeTab === 'photos'
                  ? 'Photo posts will appear here.'
                  : 'Video posts will appear here.'}
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={filteredPosts.length ? styles.gridRow : undefined}
        refreshControl={
          token && userId ? (
            <RefreshControl
              refreshing={postsQuery.isRefetching && !postsQuery.isLoading}
              onRefresh={() => postsQuery.refetch()}
            />
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

function ProfileGridTile({ item }: { item: TeaPost }) {
  const hasVideo = !!item.videoAttachmentIds?.length;
  const hasImage = !!item.imageUrls?.length;
  const hasMedia = hasVideo || hasImage;

  const preview =
    item.edVideoPosterUrl ||
    item.videoPosterUrls?.[0] ||
    item.imageUrls?.[0] ||
    VIDEO_PLACEHOLDER;

  const textPreview = String(item.content || '').trim();

  if (!hasMedia) {
    return (
      <Pressable
        style={[styles.tile, styles.textTile]}
        onPress={() => router.push(`/tea/post/${item.id}`)}
      >
        <View style={styles.textTileBadge}>
          <Text style={styles.textTileBadgeText}>Aa</Text>
        </View>

        <View style={styles.textTileContent}>
          <Text
            style={styles.textTileText}
            numberOfLines={5}
          >
            {textPreview || 'Text post'}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.tile}
      onPress={() => router.push(`/tea/post/${item.id}`)}
    >
      <Image
        source={{ uri: preview }}
        style={styles.tileImage}
        resizeMode="cover"
      />

      {hasVideo ? (
        <View style={styles.tileBadge}>
          <Text style={styles.tileBadgeText}>▶</Text>
        </View>
      ) : null}
    </Pressable>
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
    paddingBottom: 14,
    backgroundColor: '#f6f6f7',
  },
  loggedOutCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 20,
    alignItems: 'center',
  },
  loggedOutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
  },
  profileTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  profileMeta: {
    flex: 1,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
  },
  handle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  bio: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ececf1',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: '#111',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ececf1',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  sectionTab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  sectionTabActive: {
    backgroundColor: '#111',
  },
  sectionTabText: {
    color: '#555',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTabTextActive: {
    color: '#fff',
  },
  resultLabel: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  gridRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e9e9ec',
    marginBottom: 8,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e9e9ec',
  },
  tileBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  tileBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
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
  textTile: {
  backgroundColor: '#f1eefc',
  padding: 12,
  justifyContent: 'space-between',
},
textTileBadge: {
  alignSelf: 'flex-end',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor: 'rgba(0,0,0,0.08)',
},
textTileBadgeText: {
  fontSize: 11,
  fontWeight: '800',
  color: '#444',
},
textTileContent: {
  flex: 1,
  justifyContent: 'center',
},
textTileText: {
  fontSize: 14,
  lineHeight: 19,
  fontWeight: '700',
  color: '#222',
},
});