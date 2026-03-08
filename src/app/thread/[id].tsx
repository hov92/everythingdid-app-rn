import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
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
} from "react-native";
import {
  deleteReply,
  fetchTopicDetail,
  markBestReply,
  postReply,
  ReplyRow,
  updateReply,
  votePost,
} from "../../lib/api";
import {
  pickSingleImage,
  takePhoto,
  uploadWpMedia,
  PickedMedia,
} from "../../lib/media";
import { useAuthStore } from "../../store/auth-store";

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topicId = Number(id ?? 0);

  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const queryClient = useQueryClient();

  const [replyText, setReplyText] = useState("");
  const [pickedImage, setPickedImage] = useState<PickedMedia | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const detailQuery = useQuery({
    queryKey: ["thread-detail", topicId],
    queryFn: () => fetchTopicDetail(topicId),
    enabled: !!topicId,
  });

  async function refreshAll() {
    await queryClient.invalidateQueries({
      queryKey: ["thread-detail", topicId],
    });
    await queryClient.invalidateQueries({
      queryKey: ["topics"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["following-topics"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["saved-threads"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["subscribed-threads"],
    });
  }

  function patchReplyCountInLists(delta: number) {
    const patchRows = (rows: any) => {
      if (!Array.isArray(rows)) return rows;

      return rows.map((row: any) => {
        if (Number(row?.id) !== Number(topicId)) return row;

        const current = Number(row?.replyCount ?? 0);
        return {
          ...row,
          replyCount: Math.max(0, current + delta),
        };
      });
    };

    queryClient.setQueriesData({ queryKey: ["topics"] }, patchRows);
    queryClient.setQueriesData({ queryKey: ["following-topics"] }, patchRows);
    queryClient.setQueriesData({ queryKey: ["saved-threads"] }, patchRows);
    queryClient.setQueriesData({ queryKey: ["subscribed-threads"] }, patchRows);
  }

  const replyMutation = useMutation({
    mutationFn: async () => {
      let mediaIds: number[] = [];

      if (pickedImage) {
        setUploadingImage(true);
        const mediaId = await uploadWpMedia(pickedImage);
        setUploadingImage(false);

        if (mediaId) mediaIds = [mediaId];
      }

      return postReply({
        topicId,
        content: replyText.trim(),
        mediaIds,
      });
    },
    onSuccess: async () => {
      setReplyText("");
      setPickedImage(null);
      patchReplyCountInLists(1);
      await refreshAll();
    },
    onError: (e: any) => {
      setUploadingImage(false);
      Alert.alert("Reply failed", e?.message || "Could not post reply.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (replyId: number) => deleteReply(replyId),
    onSuccess: async () => {
      patchReplyCountInLists(-1);
      await refreshAll();
    },
    onError: (e: any) => {
      Alert.alert("Delete failed", e?.message || "Could not delete reply.");
    },
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateReply({
        replyId: editingReplyId!,
        topicId,
        content: editingText.trim(),
      }),
    onSuccess: async () => {
      setEditingReplyId(null);
      setEditingText("");
      await refreshAll();
    },
    onError: (e: any) => {
      Alert.alert("Edit failed", e?.message || "Could not update reply.");
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({
      postId,
      hasVoted,
    }: {
      postId: number;
      hasVoted: boolean;
    }) =>
      votePost({
        postId,
        direction: hasVoted ? "remove" : "up",
      }),
    onSuccess: async () => {
      await refreshAll();
    },
    onError: (e: any) => {
      Alert.alert("Vote failed", e?.message || "Could not update vote.");
    },
  });

  const bestMutation = useMutation({
    mutationFn: (replyId: number) =>
      markBestReply({
        topicId,
        replyId,
      }),
    onSuccess: async () => {
      await refreshAll();
    },
    onError: (e: any) => {
      Alert.alert("Best response failed", e?.message || "Could not mark best response.");
    },
  });

  const detail = detailQuery.data;
  const busy = replyMutation.isPending || uploadingImage;
  const canReply = replyText.trim().length > 0 && !busy;
  const canSaveEdit = editingText.trim().length > 0 && !editMutation.isPending;
  const canMarkBest = !!userId && Number(detail?.authorId ?? 0) === Number(userId);

  async function handlePickImage() {
    try {
      const file = await pickSingleImage();
      if (file) setPickedImage(file);
    } catch (e) {
      console.log("pick image failed", e);
    }
  }

  async function handleTakePhoto() {
    try {
      const file = await takePhoto();
      if (file) setPickedImage(file);
    } catch (e) {
      console.log("take photo failed", e);
    }
  }

  function requireLogin() {
    if (!token) {
      router.push("/login");
      return false;
    }
    return true;
  }

  function handleReply() {
    if (!requireLogin()) return;
    if (!replyText.trim()) return;
    replyMutation.mutate();
  }

  function handleVote(postId: number, hasVoted: boolean) {
    if (!requireLogin()) return;
    voteMutation.mutate({ postId, hasVoted });
  }

  function handleDeleteReply(reply: ReplyRow) {
    Alert.alert("Delete reply", "Are you sure you want to delete this reply?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(reply.id),
      },
    ]);
  }

  function startEditing(reply: ReplyRow) {
    setEditingReplyId(reply.id);
    setEditingText(reply.text);
  }

  function cancelEditing() {
    setEditingReplyId(null);
    setEditingText("");
  }

  function saveEdit() {
    if (!editingReplyId || !editingText.trim()) return;
    editMutation.mutate();
  }

  function handleMarkBest(replyId: number) {
    if (!requireLogin()) return;
    bestMutation.mutate(replyId);
  }

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
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <FlatList
          data={detail.replies}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ReplyCard
              item={item}
              canManage={!!userId && Number(item.authorId) === Number(userId)}
              canMarkBest={canMarkBest}
              deleting={
                deleteMutation.isPending &&
                deleteMutation.variables === item.id
              }
              voting={
                voteMutation.isPending &&
                voteMutation.variables?.postId === item.id
              }
              markingBest={
                bestMutation.isPending &&
                bestMutation.variables === item.id
              }
              editing={editingReplyId === item.id}
              editingText={editingText}
              editPending={editMutation.isPending}
              canSaveEdit={canSaveEdit}
              onDelete={() => handleDeleteReply(item)}
              onStartEdit={() => startEditing(item)}
              onCancelEdit={cancelEditing}
              onSaveEdit={saveEdit}
              onChangeEditText={setEditingText}
              onVote={() => handleVote(item.id, !!item.viewerHasVoted)}
              onMarkBest={() => handleMarkBest(item.id)}
            />
          )}
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
                  <Text style={styles.metaText}>
                    {detail.replies.length} replies
                  </Text>
                </View>

                <Text style={styles.content}>{detail.content}</Text>

                <View style={styles.topicVoteRow}>
                  <Pressable
                    onPress={() => handleVote(detail.id, !!detail.viewerHasVoted)}
                    style={[
                      styles.voteBtn,
                      detail.viewerHasVoted && styles.voteBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.voteBtnText,
                        detail.viewerHasVoted && styles.voteBtnTextActive,
                      ]}
                    >
                      ▲ {detail.voteCount ?? 0}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.replyHeader}>Replies</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No replies yet</Text>
              <Text style={styles.emptyText}>
                This thread has no replies yet.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.replyBar}>
          {pickedImage ? (
            <View style={styles.previewWrap}>
              <Image
                source={{ uri: pickedImage.uri }}
                style={styles.previewImage}
              />
              <Pressable
                onPress={() => setPickedImage(null)}
                style={styles.removePreviewBtn}
              >
                <Text style={styles.removePreviewText}>Remove</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.replyControls}>
            <Pressable onPress={handlePickImage} style={styles.mediaBtn}>
              <Text style={styles.mediaBtnText}>🖼️</Text>
            </Pressable>

            <Pressable onPress={handleTakePhoto} style={styles.mediaBtn}>
              <Text style={styles.mediaBtnText}>📷</Text>
            </Pressable>

            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder={token ? "Write a reply..." : "Log in to reply..."}
              placeholderTextColor="#8b8b8b"
              style={styles.replyInput}
              multiline
              editable={!busy}
            />

            <Pressable
              onPress={handleReply}
              style={[styles.replyBtn, !canReply && styles.replyBtnDisabled]}
              disabled={!canReply && !!token}
            >
              <Text style={styles.replyBtnText}>
                {busy ? "Posting..." : "Post"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReplyCard({
  item,
  canManage,
  canMarkBest,
  deleting,
  voting,
  markingBest,
  editing,
  editingText,
  editPending,
  canSaveEdit,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onChangeEditText,
  onVote,
  onMarkBest,
}: {
  item: ReplyRow;
  canManage: boolean;
  canMarkBest: boolean;
  deleting: boolean;
  voting: boolean;
  markingBest: boolean;
  editing: boolean;
  editingText: string;
  editPending: boolean;
  canSaveEdit: boolean;
  onDelete: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onChangeEditText: (value: string) => void;
  onVote: () => void;
  onMarkBest: () => void;
}) {
  return (
    <View style={styles.replyCard}>
      {item.isBestResponse ? (
        <View style={styles.bestBadge}>
          <Text style={styles.bestBadgeText}>Best Response</Text>
        </View>
      ) : null}

      <View style={styles.replyTopRow}>
        <View style={styles.replyMetaWrap}>
          <Text style={styles.metaTextStrong}>{item.author}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{formatTime(item.time)}</Text>
        </View>

        {canManage ? (
          <View style={styles.replyActionRow}>
            {!editing ? (
              <>
                <Pressable onPress={onStartEdit} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>

                <Pressable onPress={onDelete} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>
                    {deleting ? "Deleting..." : "Delete"}
                  </Text>
                </Pressable>
              </>
            ) : null}
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
            placeholder="Edit your reply..."
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
                {editPending ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.replyText}>{item.text}</Text>

          <View style={styles.replyFooterRow}>
            <Pressable
              onPress={onVote}
              style={[
                styles.voteBtn,
                item.viewerHasVoted && styles.voteBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.voteBtnText,
                  item.viewerHasVoted && styles.voteBtnTextActive,
                ]}
              >
                {voting ? "..." : `▲ ${item.voteCount ?? 0}`}
              </Text>
            </Pressable>

            {canMarkBest && !item.isBestResponse ? (
              <Pressable onPress={onMarkBest} style={styles.bestActionBtn}>
                <Text style={styles.bestActionBtnText}>
                  {markingBest ? "Saving..." : "Mark Best"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

function formatTime(value: string) {
  if (!value) return "Now";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f6f7",
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#333",
  },
  backBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#111",
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 150,
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ececf1",
    marginBottom: 12,
  },
  backPillText: {
    color: "#111",
    fontWeight: "700",
  },
  opCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ececf1",
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#161616",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 10,
  },
  metaText: {
    fontSize: 12,
    color: "#707070",
    fontWeight: "500",
  },
  metaTextStrong: {
    fontSize: 12,
    color: "#333",
    fontWeight: "700",
  },
  metaDot: {
    fontSize: 12,
    color: "#a0a0a0",
    marginHorizontal: 6,
  },
  content: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 23,
    color: "#333",
  },
  topicVoteRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  replyHeader: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  replyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ececf1",
  },
  bestBadge: {
    alignSelf: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff4d6",
  },
  bestBadgeText: {
    color: "#9a6700",
    fontSize: 12,
    fontWeight: "700",
  },
  replyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  replyMetaWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },
  replyActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e9f0fb",
  },
  editBtnText: {
    color: "#175cd3",
    fontSize: 12,
    fontWeight: "700",
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fbe9e9",
  },
  deleteBtnText: {
    color: "#b42318",
    fontSize: 12,
    fontWeight: "700",
  },
  replyText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#333",
  },
  replyFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  voteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f1f4",
  },
  voteBtnActive: {
    backgroundColor: "#ebe9ff",
  },
  voteBtnText: {
    color: "#444",
    fontSize: 12,
    fontWeight: "700",
  },
  voteBtnTextActive: {
    color: "#5b49f5",
  },
  bestActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e9f0fb",
  },
  bestActionBtnText: {
    color: "#175cd3",
    fontSize: 12,
    fontWeight: "700",
  },
  editInput: {
    marginTop: 10,
    minHeight: 90,
    backgroundColor: "#f3f3f6",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
    textAlignVertical: "top",
  },
  editActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ececf1",
  },
  cancelBtnText: {
    color: "#333",
    fontSize: 12,
    fontWeight: "700",
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#111",
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  empty: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },
  replyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 18 : 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ececf1",
  },
  previewWrap: {
    marginBottom: 10,
  },
  previewImage: {
    width: 110,
    height: 110,
    borderRadius: 14,
    backgroundColor: "#eee",
  },
  removePreviewBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#ececf1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  removePreviewText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 12,
  },
  replyControls: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  mediaBtn: {
    width: 42,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#f1f1f4",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaBtnText: {
    fontSize: 18,
  },
  replyInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    backgroundColor: "#f3f3f6",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
  },
  replyBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  replyBtnDisabled: {
    opacity: 0.45,
  },
  replyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});