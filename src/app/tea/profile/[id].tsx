import { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
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
import { fetchTeaPosts, TeaPost } from '../../../lib/tea-api';
import { useAuthStore } from '../../../store/auth-store';
import TeaFollowButton from '../../../components/tea/TeaFollowButton';

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

export default function TeaProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profileUserId = Number(id ?? 0);
  const currentUserId = useAuthStore((s) => s.userId);

  const postsQuery = useQuery({
    queryKey: ['tea-posts', 'profile', profileUserId],
    queryFn: () =>
      fetchTeaPosts({
        feed: 'profile',
        userId: profileUserId,
      }),
    enabled: !!profileUserId,
  });

  const posts = postsQuery.data ?? [];
  const profilePost = posts[0];

  const profileName = profilePost?.author || `User ${profileUserId}`;
  const profileAvatar = profilePost?.authorAvatarUrl || '';

  const header = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>

        <View style={styles.profileCard}>
          {profileAvatar ? (
            <Image source={{ uri: profileAvatar }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.profileAvatar} />
          )}

          <Text style={styles.profileName}>{profileName}</Text>

          <View style={styles.profileMetaRow}>
            <View style={styles.profileMetaBlock}>
              <Text style={styles.profileMetaValue}>{posts.length}</Text>
              <Text style={styles.profileMetaLabel}>Posts</Text>
            </View>
          </View>

          <View style={styles.profileActions}>
            <TeaFollowButton
              authorId={profileUserId}
              currentUserId={currentUserId}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tea Posts</Text>
      </View>
    ),
    [profileAvatar, profileName, posts.length, profileUserId, currentUserId]
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ProfilePostCard item={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          postsQuery.isLoading ? (
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
              <Text style={styles.emptyTitle}>No Tea posts yet</Text>
              <Text style={styles.emptyText}>
                This user has not posted anything yet.
              </Text>
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

function ProfilePostCard({ item }: { item: TeaPost }) {
  const hasVideo = !!item.videoAttachmentIds?.length;
  const hasImage = !!item.imageUrls?.length;
  const previewImage =
    item.edVideoPosterUrl ||
    item.videoPosterUrls?.[0] ||
    item.imageUrls?.[0] ||
    VIDEO_PLACEHOLDER;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/tea/post/${item.id}`)}
    >
      <View style={styles.cardTopRow}>
        <Text style={styles.cardDate}>{formatTime(item.time)}</Text>
      </View>

      {!!item.content?.trim() ? (
        <Text style={styles.cardContent} numberOfLines={4}>
          {item.content}
        </Text>
      ) : null}

      {hasVideo || hasImage ? (
        <View style={styles.mediaWrap}>
          <Image
            source={{ uri: previewImage }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {hasVideo ? (
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>▶ Video</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.cardStats}>
        <Text style={styles.cardStatText}>♥ {item.favoriteCount ?? 0}</Text>
        <Text style={styles.cardStatText}>💬 {item.commentCount}</Text>
      </View>
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
    paddingTop: 14,
    paddingBottom: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ececf1',
    marginBottom: 12,
  },
  backBtnText: {
    color: '#111',
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ececf1',
    padding: 20,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  profileName: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
  },
  profileMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 14,
  },
  profileMetaBlock: {
    alignItems: 'center',
    minWidth: 72,
  },
  profileMetaValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  profileMetaLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  profileActions: {
    marginTop: 4,
  },
  sectionTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
  },
  cardContent: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#222',
  },
  mediaWrap: {
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  cardImage: {
    width: '100%',
    height: 280,
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
  cardStats: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
  },
  cardStatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
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