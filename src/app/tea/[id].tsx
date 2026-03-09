import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createTeaComment,
  deleteTeaComment,
  fetchTeaComments,
  fetchTeaPostDetail,
  TeaComment,
  toggleTeaFavorite,
  updateTeaComment,
} from '../../lib/tea-api';
import { useAuthStore } from '../../store/auth-store';

export default function TeaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityId = Number(id ?? 0);

  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const postQuery = useQuery({
    queryKey: ['tea-post', activityId],
    queryFn: () => fetchTeaPostDetail(activityId),
    enabled: !!activityId,
  });

  const commentsQuery = useQuery({
    queryKey: ['tea-comments', activityId],
    queryFn: () => fetchTeaComments(activityId),
    enabled: !!activityId,
  });

  const favoriteMutation = useMutation({
    mutationFn: ({
      favorite,
    }: {
      favorite: boolean;
    }) => toggleTeaFavorite({ activityId, favorite }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tea-post', activityId] });
      await queryClient.invalidateQueries({ queryKey: ['tea-posts'] });
    },
    onError: (e: any) => {
      Alert.alert('Like failed', e?.message || 'Could not update like.');
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: () =>
      createTeaComment({
        activityId,
        content: commentText.trim(),
      }),
    onSuccess: async () => {
      setCommentText('');
      await queryClient.invalidateQueries({ queryKey: ['tea-comments', activityId] });
      await queryClient.invalidateQueries({ queryKey: ['tea-post', activityId] });
      await queryClient.invalidateQueries({ queryKey: ['tea-posts'] });
    },
    onError: (e: any) => {
      Alert.alert('Comment failed', e?.message || 'Could not add comment.');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteTeaComment(commentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tea-comments', activityId] });
      await queryClient.invalidateQueries({ queryKey: ['tea-post', activityId] });
      await queryClient.invalidateQueries({ queryKey: ['tea-posts'] });
    },
    onError: (e: any) => {
      Alert.alert('Delete failed', e?.message || 'Could not delete comment.');
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: () =>
      updateTeaComment({
        commentId: editingCommentId!,
        content: editingText.trim(),
      }),
    onSuccess: async () => {
      setEditingCommentId(null);
      setEditingText('');
      await queryClient.invalidateQueries({ queryKey: ['tea-comments', activityId] });
    },
    onError: (e: any) => {
      Alert.alert('Edit failed', e?.message || 'Could not update comment.');
    },
  });

  const post = postQuery.data;
  const comments = commentsQuery.data ?? [];
  const busy = createCommentMutation.isPending;
  const canComment = commentText.trim().length > 0 && !busy;
  const canSaveEdit = editingText.trim().length > 0 && !editCommentMutation.isPending;

  function handleComment() {
    if (!token) {
      router.push('/login');
      return;
    }

    if (!commentText.trim()) return;
    createCommentMutation.mutate();
  }

  function handleDeleteComment(comment: TeaComment) {
    Alert.alert('Delete comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCommentMutation.mutate(comment.id),
      },
    ]);
  }

  if (postQuery.isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (postQuery.isError || !post) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Could not load tea post.</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const hasText = !!post.content?.trim();
const hasImage = !!post.imageUrls?.length;
const hasVideo = !!post.videoUrls?.length;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TeaCommentCard
              item={item}
              canManage={!!userId && Number(item.authorId) === Number(userId)}
              editing={editingCommentId === item.id}
              editingText={editingText}
              editPending={editCommentMutation.isPending}
              canSaveEdit={canSaveEdit}
              deleting={
                deleteCommentMutation.isPending &&
                deleteCommentMutation.variables === item.id
              }
              onStartEdit={() => {
                setEditingCommentId(item.id);
                setEditingText(item.text);
              }}
              onCancelEdit={() => {
                setEditingCommentId(null);
                setEditingText('');
              }}
              onChangeEditText={setEditingText}
              onSaveEdit={() => editCommentMutation.mutate()}
              onDelete={() => handleDeleteComment(item)}
            />
          )}
          ListHeaderComponent={
            <View style={styles.headerWrap}>
              <Pressable onPress={() => router.back()} style={styles.backPill}>
                <Text style={styles.backPillText}>Back</Text>
              </Pressable>

              <View style={styles.postCard}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaTextStrong}>{post.author}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{formatTime(post.time)}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{comments.length} comments</Text>
                </View>

                <Text style={styles.postContent}>{post.content}</Text>

                {post.imageUrls.length ? (
                  <Image
                    source={{ uri: post.imageUrls[0] }}
                    style={styles.postImage}
                  />
                ) : null}

                <View style={styles.postFooterRow}>
                  <Pressable
                    onPress={() => {
                      if (!token) {
                        router.push('/login');
                        return;
                      }
                      favoriteMutation.mutate({
                        favorite: !post.viewerHasLiked,
                      });
                    }}
                    style={[
                      styles.likeChip,
                      post.viewerHasLiked && styles.likeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.likeChipText,
                        post.viewerHasLiked && styles.likeChipTextActive,
                      ]}
                    >
                      {favoriteMutation.isPending
                        ? 'Saving...'
                        : `♥ ${post.favoriteCount ?? 0}`}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.commentHeader}>Comments</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptyText}>Start the conversation below.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.commentBar}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder={token ? 'Write a comment...' : 'Log in to comment...'}
            placeholderTextColor="#8b8b8b"
            style={styles.commentInput}
            multiline
            editable={!busy}
          />

          <Pressable
            onPress={handleComment}
            style={[styles.commentBtn, !canComment && styles.commentBtnDisabled]}
            disabled={!canComment && !!token}
          >
            <Text style={styles.commentBtnText}>
              {busy ? 'Posting...' : 'Post'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TeaCommentCard({
  item,
  canManage,
  editing,
  editingText,
  editPending,
  canSaveEdit,
  deleting,
  onStartEdit,
  onCancelEdit,
  onChangeEditText,
  onSaveEdit,
  onDelete,
}: {
  item: TeaComment;
  canManage: boolean;
  editing: boolean;
  editingText: string;
  editPending: boolean;
  canSaveEdit: boolean;
  deleting: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditText: (value: string) => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.commentCard}>
      <View style={styles.commentTopRow}>
        <View style={styles.commentMetaWrap}>
          <Text style={styles.metaTextStrong}>{item.author}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{formatTime(item.time)}</Text>
        </View>

        {canManage && !editing ? (
          <View style={styles.commentActionRow}>
            <Pressable onPress={onStartEdit} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>

            <Pressable onPress={onDelete} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {editing ? (
        <>
          <TextInput
            value={editingText}
            onChangeText={onChangeEditText}
            multiline
            style={styles.editInput}
            placeholder="Edit your comment..."
            placeholderTextColor="#8b8b8b"
          />

          <View style={styles.editActionsRow}>
            <Pressable onPress={onCancelEdit} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onSaveEdit}
              style={[styles.saveBtn, !canSaveEdit && styles.saveBtnDisabled]}
              disabled={!canSaveEdit}
            >
              <Text style={styles.saveBtnText}>
                {editPending ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Text style={styles.commentText}>{item.text}</Text>
      )}
    </View>
  );
}
function DetailVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.postImage}
      nativeControls
      contentFit="cover"
    />
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
    paddingBottom: 150,
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
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ececf1',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
  postContent: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 23,
    color: '#333',
  },

  likeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f1f1f4',
  },
  likeChipActive: {
    backgroundColor: '#ffe8ef',
  },
  likeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
  },
  likeChipTextActive: {
    color: '#d6336c',
  },
  commentHeader: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  commentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ececf1',
  },
  commentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  commentMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  commentActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: '#333',
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e9f0fb',
  },
  editBtnText: {
    color: '#175cd3',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fbe9e9',
  },
  deleteBtnText: {
    color: '#b42318',
    fontSize: 12,
    fontWeight: '700',
  },
  editInput: {
    marginTop: 10,
    minHeight: 90,
    backgroundColor: '#f3f3f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
    textAlignVertical: 'top',
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ececf1',
  },
  cancelBtnText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
  commentBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ececf1',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    backgroundColor: '#f3f3f6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
  },
  commentBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentBtnDisabled: {
    opacity: 0.45,
  },
  commentBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  postTopRow: {
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
mediaWrap: {
  marginTop: 12,
  borderRadius: 18,
  overflow: 'hidden',
  backgroundColor: '#eee',
},
postImage: {
  width: '100%',
  height: 360,
  backgroundColor: '#eee',
},
postFooterRow: {
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
});