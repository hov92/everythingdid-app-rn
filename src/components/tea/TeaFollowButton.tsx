import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchFollowStatus,
  followMember,
  unfollowMember,
} from '../../lib/tea-api';

export default function TeaFollowButton({
  authorId,
  currentUserId,
  small = false,
  dark = false,
}: {
  authorId?: number;
  currentUserId?: number | null;
  small?: boolean;
  dark?: boolean;
}) {
  const queryClient = useQueryClient();

  const shouldHide =
    !authorId || !currentUserId || Number(authorId) === Number(currentUserId);

  const followStatusQuery = useQuery({
    queryKey: ['tea-follow-status', authorId],
    queryFn: () => fetchFollowStatus(authorId!),
    enabled:
      !!authorId &&
      !!currentUserId &&
      Number(authorId) !== Number(currentUserId),
    staleTime: 30_000,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!authorId) return;
      if (followStatusQuery.data?.isFollowing) {
        return unfollowMember(authorId);
      }
      return followMember(authorId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['tea-follow-status', authorId],
      });
      await queryClient.invalidateQueries({ queryKey: ['tea-posts'] });
      await queryClient.invalidateQueries({ queryKey: ['tea-post'] });
    },
  });

  if (shouldHide) return null;

  const isFollowing = !!followStatusQuery.data?.isFollowing;
  const busy = followMutation.isPending || followStatusQuery.isLoading;

  return (
    <Pressable
      onPress={() => followMutation.mutate()}
      style={[
        styles.btn,
        small && styles.btnSmall,
        dark && styles.btnDark,
        isFollowing && styles.btnActive,
        busy && styles.btnDisabled,
      ]}
      disabled={busy}
    >
      <Text
        style={[
          styles.text,
          small && styles.textSmall,
          dark && styles.textDark,
          isFollowing && styles.textActive,
        ]}
      >
        {busy ? 'Saving...' : isFollowing ? 'Following' : 'Follow'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  btnSmall: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  btnDark: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  btnActive: {
    backgroundColor: '#111',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  text: {
    color: '#333',
    fontSize: 12,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 12,
  },
  textDark: {
    color: '#fff',
  },
  textActive: {
    color: '#fff',
  },
});