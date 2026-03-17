import React from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchTeaPostDetail } from '../../lib/tea-api';

const VIDEO_PLACEHOLDER =
  'https://everythingdid.com/wp-content/plugins/buddyboss-platform/bp-templates/bp-nouveau/images/video-placeholder.jpg';

export default function TeaSharedPostPreview({
  activityId,
}: {
  activityId: number;
}) {
  const postQuery = useQuery({
    queryKey: ['tea-post-preview', activityId],
    queryFn: () => fetchTeaPostDetail(activityId),
    enabled: !!activityId,
    staleTime: 60_000,
  });

  if (postQuery.isLoading) {
    return (
      <View style={styles.cardLoading}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (postQuery.isError || !postQuery.data) {
    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/tea/post/${activityId}`)}
      >
        <Text style={styles.fallbackTitle}>Open shared Tea post</Text>
      </Pressable>
    );
  }

  const post = postQuery.data;
  const hasImage = !!post.imageUrls?.length;
  const hasVideo = !!post.videoAttachmentIds?.length;
  const previewImage =
    post.edVideoPosterUrl ||
    post.videoPosterUrls?.[0] ||
    post.imageUrls?.[0] ||
    VIDEO_PLACEHOLDER;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/tea/post/${activityId}`)}
    >
      <View style={styles.topRow}>
        {post.authorAvatarUrl ? (
          <Image source={{ uri: post.authorAvatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}

        <View style={styles.metaWrap}>
          <Text style={styles.authorName} numberOfLines={1}>
            {post.author}
          </Text>
          <Text style={styles.label}>Shared Tea post</Text>
        </View>
      </View>

      {!!post.content?.trim() ? (
        <Text style={styles.content} numberOfLines={3}>
          {post.content}
        </Text>
      ) : null}

      {(hasImage || hasVideo) && (
        <View style={styles.mediaWrap}>
          <Image
            source={{ uri: previewImage }}
            style={styles.media}
            resizeMode="cover"
          />
          {hasVideo ? (
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>▶ Video</Text>
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ececf1',
    backgroundColor: '#f8f8fb',
    overflow: 'hidden',
    padding: 12,
  },
  cardLoading: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ececf1',
    backgroundColor: '#f8f8fb',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  metaWrap: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#777',
  },
  content: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#222',
  },
  mediaWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e9e9ec',
  },
  media: {
    width: '100%',
    height: 160,
    backgroundColor: '#e9e9ec',
  },
  videoBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});