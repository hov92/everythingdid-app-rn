import { useAuthStore } from "../store/auth-store";

const API_BASE = "https://everythingdid.com/wp-json/buddyboss/v1";
const WP_MEDIA_BASE = "https://everythingdid.com/wp-json/wp/v2/media";
const ED_API_BASE = "https://everythingdid.com/wp-json/everythingdid/v1";

export type TeaPost = {
  id: number;
  content: string;
  author: string;
  authorId?: number;
  authorAvatarUrl?: string;
  time: string;
  favoriteCount?: number;
  viewerHasLiked?: boolean;
  commentCount: number;
  imageUrls: string[];
  videoUrls: string[];
  videoPosterUrls: string[];
  videoAttachmentIds: number[];
  edVideoPosterId?: number;
  edVideoPosterUrl?: string;
};

export type TeaComment = {
  id: number;
  postId: number;
  text: string;
  author: string;
  authorId?: number;
  authorAvatarUrl?: string;
  time: string;
};

function htmlToText(html: string) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&#0*38;|&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function authedHeaders(): Promise<Record<string, string>> {
  const token = useAuthStore.getState().token;
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(await authedHeaders()),
    },
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(raw?.message || "Request failed");
  }

  return raw;
}

async function apiPost(path: string, payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authedHeaders()),
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(raw?.message || raw?.code || "Request failed");
  }

  return raw;
}

async function apiDelete(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      ...(await authedHeaders()),
    },
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(raw?.message || raw?.code || "Request failed");
  }

  return raw;
}

async function edApiGet(path: string) {
  const res = await fetch(`${ED_API_BASE}${path}`, {
    headers: {
      ...(await authedHeaders()),
    },
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(raw?.message || raw?.code || "Request failed");
  }

  return raw;
}

async function edApiPost(path: string, payload: Record<string, any>) {
  const res = await fetch(`${ED_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authedHeaders()),
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(raw?.message || raw?.code || "Request failed");
  }

  return raw;
}

async function fetchWpMediaSourceUrl(
  attachmentId: number,
): Promise<string | null> {
  if (!attachmentId) return null;

  const res = await fetch(`${WP_MEDIA_BASE}/${attachmentId}`, {
    headers: {
      ...(await authedHeaders()),
    },
  });

  const raw = await res.json().catch(() => null);
  if (!res.ok) return null;

  return String(raw?.source_url ?? "").trim() || null;
}

function pickActivityAuthorName(item: any): string {
  return String(
    item?.user_name ??
      item?.name ??
      item?.display_name ??
      item?.author_name ??
      item?.user?.name ??
      "",
  ).trim();
}

function pickActivityAuthorId(item: any): number {
  return Number(item?.user_id ?? item?.author ?? item?.id_user ?? 0);
}

function pickActivityAvatarUrl(item: any): string {
  return String(
    item?.user_avatar?.thumb ??
      item?.user_avatar?.full ??
      item?.avatar ??
      item?.author_avatar ??
      item?.user?.avatar ??
      "",
  ).trim();
}

function pickActivityImageUrls(item: any): string[] {
  const urls: string[] = [];

  const mediaArr = Array.isArray(item?.bp_media_ids)
    ? item.bp_media_ids
    : Array.isArray(item?.bbp_media)
      ? item.bbp_media
      : Array.isArray(item?.bp_media)
        ? item.bp_media
        : Array.isArray(item?.media)
          ? item.media
          : [];

  for (const media of mediaArr) {
    const url = String(
      media?.attachment_data?.thumb ??
        media?.attachment_data?.medium ??
        media?.attachment_data?.full ??
        media?.url ??
        media?.source_url ??
        "",
    ).trim();

    if (url) urls.push(url);
  }

  return [...new Set(urls)];
}

function pickActivityVideoAttachmentIds(item: any): number[] {
  const ids: number[] = [];

  const videoArr = Array.isArray(item?.bp_videos)
    ? item.bp_videos
    : Array.isArray(item?.bb_videos)
      ? item.bb_videos
      : Array.isArray(item?.videos)
        ? item.videos
        : [];

  for (const video of videoArr) {
    const id = Number(video?.attachment_id ?? 0);
    if (id) ids.push(id);
  }

  return [...new Set(ids)];
}

function pickActivityVideoPosterUrls(item: any): string[] {
  const urls: string[] = [];

  const videoArr = Array.isArray(item?.bp_videos)
    ? item.bp_videos
    : Array.isArray(item?.bb_videos)
      ? item.bb_videos
      : Array.isArray(item?.videos)
        ? item.videos
        : [];

  for (const video of videoArr) {
    const attachment = video?.attachment_data ?? {};

    const candidates = [
      attachment?.video_activity_thumb,
      attachment?.video_popup_thumb,
      attachment?.thumb,
      attachment?.full,
    ]
      .map((v: any) => String(v || "").trim())
      .filter(Boolean);

    const nonPlaceholder = candidates.find(
      (url) => !url.includes("video-placeholder.jpg"),
    );

    if (nonPlaceholder) {
      urls.push(nonPlaceholder);
    } else if (candidates[0]) {
      urls.push(candidates[0]);
    }
  }

  return [...new Set(urls)];
}

async function pickActivityVideoUrls(item: any): Promise<string[]> {
  const attachmentIds = pickActivityVideoAttachmentIds(item);
  if (!attachmentIds.length) return [];

  const urls = await Promise.all(
    attachmentIds.map((id) => fetchWpMediaSourceUrl(id)),
  );

  return [...new Set(urls.filter(Boolean) as string[])];
}

function extractActivityText(item: any): string {
  const contentRendered =
    typeof item?.content?.rendered === "string" ? item.content.rendered : "";
  const contentRaw =
    typeof item?.content?.raw === "string" ? item.content.raw : "";
  const contentString = typeof item?.content === "string" ? item.content : "";

  const text = htmlToText(
    contentRendered || contentRaw || contentString,
  ).trim();
  return text === "." ? "" : text;
}

export async function fetchTeaPoster(activityId: number | string): Promise<{
  poster_id?: number;
  poster_url?: string;
}> {
  const raw = await edApiGet(`/activity-meta/${activityId}`);
  return {
    poster_id: Number(raw?.poster_id ?? 0) || undefined,
    poster_url: String(raw?.poster_url ?? "").trim() || undefined,
  };
}

async function mapActivityItem(
  item: any,
  options?: { includeVideoUrls?: boolean },
): Promise<TeaPost> {
  const authorId = pickActivityAuthorId(item);
  const videoAttachmentIds = pickActivityVideoAttachmentIds(item);
  const directPosterUrl =
    String(item?.ed_video_poster_url ?? "").trim() || undefined;
  const directPosterId = Number(item?.ed_video_poster_id ?? 0) || undefined;

  let fallbackPosterUrl: string | undefined;
  let fallbackPosterId: number | undefined;

  if (videoAttachmentIds.length > 0 && !directPosterUrl) {
    try {
      const poster = await fetchTeaPoster(Number(item?.id ?? 0));
      fallbackPosterUrl = poster.poster_url;
      fallbackPosterId = poster.poster_id;
    } catch (_e) {}

  }

  return {
    id: Number(item?.id ?? 0),
    content: extractActivityText(item),
    author:
      pickActivityAuthorName(item) ||
      `User ${authorId || ""}`.trim() ||
      "Unknown",
    authorId,
    authorAvatarUrl: pickActivityAvatarUrl(item),
    time: String(item?.date ?? item?.date_gmt ?? item?.modified ?? ""),
    favoriteCount: Number(item?.favorite_count ?? item?.favorites_count ?? 0),
    viewerHasLiked:
      typeof item?.favorited === "boolean"
        ? item.favorited
        : typeof item?.favorite === "boolean"
          ? item.favorite
          : false,
    commentCount: Number(item?.comment_count ?? item?.comments_count ?? 0),
    imageUrls: pickActivityImageUrls(item),
    videoUrls: options?.includeVideoUrls
      ? await pickActivityVideoUrls(item)
      : [],
    videoPosterUrls: pickActivityVideoPosterUrls(item),
    videoAttachmentIds,
    edVideoPosterId: directPosterId || fallbackPosterId,
    edVideoPosterUrl: directPosterUrl || fallbackPosterUrl,
  };
}

export async function fetchTeaPosts(params?: {
  search?: string;
  feed?: "for-you" | "following" | "explore" | "profile";
  userId?: number;
  includeVideoUrls?: boolean;
}): Promise<TeaPost[]> {
  const qs = new URLSearchParams();
  qs.set("per_page", "20");
  qs.set("page", "1");
  qs.set("display_comments", "threaded");
  qs.set("order", "desc");
  qs.set("component", "activity");

  if (params?.search?.trim()) {
    qs.set("search", params.search.trim());
  }

  if (params?.feed === "following") {
    qs.set("scope", "following");
  }

  if (params?.userId) {
    qs.set("user_id", String(params.userId));
  }

  const raw = await apiGet(`/activity?${qs.toString()}`);

  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.activities)
      ? raw.activities
      : [];

  const filtered = arr.filter((item: any) => {
    const id = Number(item?.id ?? 0);
    const type = String(item?.type ?? "").toLowerCase();
    const content = extractActivityText(item).trim().toLowerCase();
    const hasImage = pickActivityImageUrls(item).length > 0;
    const hasVideo = pickActivityVideoAttachmentIds(item).length > 0;

    if (!id) return false;
    if (type !== "activity_update") return false;
    if (content === "reshared") return false;
    if (content.includes("view original")) return false;
    if (content.includes("posted an update")) return false;
    if (!content && !hasImage && !hasVideo) return false;

    return true;
  });

  return Promise.all(
    filtered.map((item: any) =>
      mapActivityItem(item, {
        includeVideoUrls: !!params?.includeVideoUrls,
      }),
    ),
  );
}

export async function fetchTeaPostDetail(
  activityId: number | string,
): Promise<TeaPost> {
  const raw = await apiGet(`/activity/${activityId}`);
  const mapped = await mapActivityItem(raw);

  return {
    ...mapped,
    videoUrls: await pickActivityVideoUrls(raw),
  };
}

export async function fetchTeaComments(
  activityId: number | string,
): Promise<TeaComment[]> {
  const raw = await apiGet(`/activity/${activityId}`);
  const comments = Array.isArray(raw?.comments)
    ? raw.comments
    : Array.isArray(raw?.children)
      ? raw.children
      : [];

  return comments.map((c: any) => ({
    id: Number(c?.id ?? 0),
    postId: Number(activityId),
    text:
      htmlToText(c?.content?.rendered ?? "") ||
      htmlToText(c?.content ?? "") ||
      "",
    author:
      String(
        c?.user_name ?? c?.name ?? c?.display_name ?? c?.author_name ?? "",
      ).trim() || "Unknown",
    authorId: Number(c?.user_id ?? c?.author ?? 0),
    authorAvatarUrl: String(
      c?.user_avatar?.thumb ??
        c?.user_avatar?.full ??
        c?.avatar ??
        c?.author_avatar ??
        "",
    ).trim(),
    time: String(c?.date ?? c?.date_gmt ?? c?.modified ?? ""),
  }));
}

export async function createTeaPost({
  content,
  mediaIds = [],
  videoIds = [],
}: {
  content: string;
  mediaIds?: number[];
  videoIds?: number[];
}) {
  const trimmed = String(content).trim();

  const payload: Record<string, any> = {
    content: trimmed || (mediaIds.length || videoIds.length ? '.' : ''),
    component: 'activity',
    type: 'activity_update',
    privacy: 'public',
  };

  if (mediaIds.length) {
    payload.bp_media_ids = mediaIds;
  }

  if (videoIds.length) {
    payload.bp_videos = videoIds;
  }

  return apiPost('/activity', payload);
}

export async function updateTeaPost({
  activityId,
  content,
}: {
  activityId: number | string;
  content: string;
}) {
  return apiPost(`/activity/${activityId}`, {
    content: String(content).trim(),
  });
}

export async function deleteTeaPost(activityId: number | string) {
  return apiDelete(`/activity/${activityId}`);
}

export async function createTeaComment({
  activityId,
  content,
}: {
  activityId: number | string;
  content: string;
}) {
  return apiPost("/activity", {
    content: String(content).trim(),
    type: "activity_comment",
    item_id: Number(activityId),
  });
}

export async function updateTeaComment({
  commentId,
  content,
}: {
  commentId: number | string;
  content: string;
}) {
  return apiPost(`/activity/${commentId}`, {
    content: String(content).trim(),
  });
}

export async function deleteTeaComment(commentId: number | string) {
  return apiDelete(`/activity/${commentId}`);
}

export async function toggleTeaFavorite({
  activityId,
  favorite,
}: {
  activityId: number | string;
  favorite: boolean;
}) {
  return apiPost(`/activity/${activityId}/favorite`, {
    favorite,
  });
}

export async function saveTeaPoster({
  activityId,
  posterId,
}: {
  activityId: number | string;
  posterId: number | string;
}) {
  return edApiPost(`/activity/${activityId}/poster`, {
    poster_id: Number(posterId),
  });
}

export async function followMember(userId: number | string) {
  return apiPost(`/members/action/${userId}`, {
    action: 'follow',
  });
}

export async function unfollowMember(userId: number | string) {
  return apiPost(`/members/action/${userId}`, {
    action: 'unfollow',
  });
}

export async function fetchFollowingMemberIds(): Promise<number[]> {
  const raw = await apiGet('/members?scope=following&per_page=100');

  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.members)
      ? raw.members
      : [];

  return arr
    .map((item: any) => Number(item?.id ?? 0))
    .filter(Boolean);
}

export async function fetchFollowStatus(userId: number | string): Promise<{
  isFollowing: boolean;
}> {
  const ids = await fetchFollowingMemberIds();
  return {
    isFollowing: ids.includes(Number(userId)),
  };
}

export async function fetchMeMember() {
  return apiGet('/members/me');
}

export async function updateMeMember(payload: { name?: string }) {
  return apiPost('/members/me', payload);
}

type XProfileFieldRecord = {
  id: number;
  group_id?: number;
  name?: string;
  data?: {
    value?: unknown;
  };
};

function extractXProfileValue(field: any): string {
  const raw =
    field?.data?.value?.unserialized ??
    field?.data?.value?.rendered ??
    field?.data?.value?.raw ??
    field?.data?.value ??
    field?.value?.unserialized ??
    field?.value?.rendered ??
    field?.value?.raw ??
    field?.value ??
    '';

  if (Array.isArray(raw)) {
    return raw.join(', ');
  }

  if (raw && typeof raw === 'object') {
    return String(raw?.rendered ?? raw?.raw ?? '').trim();
  }

  return String(raw ?? '').trim();
}

export async function fetchMyXProfileFields(userId: number | string) {
  const raw = await apiGet(
    `/xprofile/fields?user_id=${Number(userId)}&fetch_field_data=true`
  );

  const fields = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.fields)
      ? raw.fields
      : [];

  return fields as XProfileFieldRecord[];
}

export async function findMyBioField(userId: number | string) {
  const fields = await fetchMyXProfileFields(userId);

  const match = fields.find((field) => {
    const name = String(field?.name ?? '').trim().toLowerCase();
    return (
      name === 'bio' ||
      name === 'about me' ||
      name === 'about' ||
      name === 'description'
    );
  });

  if (!match) return null;

  return {
    id: Number(match.id),
    group_id: Number(match.group_id ?? 0) || undefined,
    name: String(match.name ?? ''),
    value: extractXProfileValue(match),
  };
}

export async function updateMyXProfileFields(fields: Array<{
  field_id: number;
  group_id?: number;
  value: string;
  visibility_level?: 'public' | 'loggedin' | 'friends' | 'adminsonly';
}>) {
  return apiPost('/xprofile/update', {
    fields,
  });
}

export type DmThread = {
  id: number;
  subject?: string;
  excerpt?: string;
  unreadCount?: number;
  recipients: Array<{
    id: number;
    name: string;
    avatar?: string;
  }>;
  updatedAt?: string;
};

export type DmMessage = {
  id: number;
  threadId: number;
  senderId?: number;
  senderName?: string;
  senderAvatar?: string;
  message: string;
  date?: string;
};

export type DmRecipient = {
  id: number;
  name: string;
  mentionName?: string;
  avatar?: string;
};

function pickMessageAvatar(item: any): string {
  return String(
    item?.avatar?.thumb ??
      item?.avatar?.full ??
      item?.sender_avatar?.thumb ??
      item?.sender_avatar?.full ??
      item?.user_avatar?.thumb ??
      item?.user_avatar?.full ??
      item?.image ??
      "",
  ).trim();
}

function pickRecipientName(item: any): string {
  return String(
    item?.name ??
      item?.display_name ??
      item?.user_name ??
      item?.recipient_name ??
      "",
  ).trim();
}

function mapDmRecipients(raw: any): Array<{ id: number; name: string; avatar?: string }> {
  const possible =
    raw?.recipients ??
    raw?.participants ??
    raw?.members ??
    raw?.users ??
    [];

  if (!Array.isArray(possible)) return [];

  return possible
    .map((item: any) => ({
      id: Number(item?.id ?? item?.user_id ?? 0),
      name: pickRecipientName(item) || `User ${Number(item?.id ?? item?.user_id ?? 0)}`,
      avatar: pickMessageAvatar(item) || undefined,
    }))
    .filter((item: any) => item.id);
}

function mapDmThread(item: any): DmThread {
  const recipients = mapDmRecipients(item);

  return {
    id: Number(item?.id ?? item?.thread_id ?? 0),
    subject: String(item?.subject?.rendered ?? item?.subject ?? "").trim() || undefined,
    excerpt: htmlToText(
      item?.excerpt?.rendered ??
        item?.message?.rendered ??
        item?.last_message?.rendered ??
        item?.content?.rendered ??
        item?.excerpt ??
        item?.message ??
        item?.last_message ??
        item?.content ??
        "",
    ),
    unreadCount: Number(item?.unread_count ?? item?.count_unread ?? 0) || 0,
    recipients,
    updatedAt: String(
      item?.date_gmt ??
        item?.date ??
        item?.last_message_date ??
        item?.message_date ??
        item?.modified ??
        "",
    ).trim() || undefined,
  };
}

function mapDmMessage(item: any, fallbackThreadId: number): DmMessage {
  return {
    id: Number(item?.id ?? item?.message_id ?? 0),
    threadId: Number(item?.thread_id ?? fallbackThreadId ?? 0),
    senderId: Number(item?.sender_id ?? item?.user_id ?? item?.author ?? 0) || undefined,
    senderName: String(
      item?.sender_name ??
        item?.display_name ??
        item?.name ??
        item?.user_name ??
        "",
    ).trim() || undefined,
    senderAvatar: pickMessageAvatar(item) || undefined,
    message: htmlToText(
      item?.message?.rendered ??
        item?.content?.rendered ??
        item?.message ??
        item?.content ??
        "",
    ),
    date: String(item?.date_gmt ?? item?.date ?? item?.modified ?? "").trim() || undefined,
  };
}

export async function fetchDmThreads(): Promise<DmThread[]> {
  const me = useAuthStore.getState().userId;
  const qs = new URLSearchParams();
  qs.set("box", "inbox");
  qs.set("per_page", "20");
  qs.set("page", "1");

  if (me) {
    qs.set("user_id", String(me));
  }

  const raw = await apiGet(`/messages?${qs.toString()}`);

  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.threads)
      ? raw.threads
      : Array.isArray(raw?.messages)
        ? raw.messages
        : [];

  return arr
    .map((item: any) => mapDmThread(item))
    .filter((item: DmThread) => item.id);
}

export async function fetchDmThread(
  threadId: number | string,
): Promise<{
  id: number;
  subject?: string;
  recipients: Array<{
    id: number;
    name: string;
    avatar?: string;
  }>;
  messages: DmMessage[];
}> {
  const raw = await apiGet(`/messages/${Number(threadId)}`);

  const recipients = mapDmRecipients(raw);

  const possibleMessages = Array.isArray(raw?.messages)
    ? raw.messages
    : Array.isArray(raw?.thread_messages)
      ? raw.thread_messages
      : Array.isArray(raw?.items)
        ? raw.items
        : [];

  return {
    id: Number(raw?.id ?? raw?.thread_id ?? threadId),
    subject: String(raw?.subject?.rendered ?? raw?.subject ?? "").trim() || undefined,
    recipients,
    messages: possibleMessages
      .map((item: any) => mapDmMessage(item, Number(threadId)))
      .filter((item: DmMessage) => item.id),
  };
}

export async function searchDmRecipients(
  term: string,
  exclude: number[] = [],
): Promise<DmRecipient[]> {
  const qs = new URLSearchParams();
  qs.set("term", term.trim());

  if (exclude.length) {
    qs.set("exclude", exclude.join(","));
  }

  const raw = await apiGet(`/messages/search-recipients?${qs.toString()}`);

  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.recipients)
      ? raw.recipients
      : Array.isArray(raw?.members)
        ? raw.members
        : [];

  return arr
    .map((item: any) => ({
      id: Number(item?.id ?? item?.user_id ?? 0),
      name:
        String(
          item?.name ??
            item?.display_name ??
            item?.user_name ??
            "",
        ).trim() || `User ${Number(item?.id ?? item?.user_id ?? 0)}`,
      mentionName: String(item?.mention_name ?? item?.user_login ?? "").trim() || undefined,
      avatar: pickMessageAvatar(item) || undefined,
    }))
    .filter((item: DmRecipient) => item.id);
}

export async function searchExistingDmThread(recipientId: number | string) {
  const qs = new URLSearchParams();
  qs.set("recipient_id", String(Number(recipientId)));

  return apiGet(`/messages/search-thread?${qs.toString()}`);
}

export async function sendNewDm(params: {
  recipientIds: number[];
  subject?: string;
  message: string;
}) {
  return apiPost("/messages", {
    recipients: params.recipientIds,
    subject: params.subject?.trim() || "New message",
    message: params.message.trim(),
  });
}

export async function replyToDm(params: {
  threadId: number;
  message: string;
}) {
  return apiPost("/messages", {
    id: Number(params.threadId),
    message: params.message.trim(),
  });
}

export function getTeaPostShareUrl(activityId: number | string) {
  return `https://everythingdid.com/news-feed/?activity_id=${Number(activityId)}`;
}

export function getTeaPostShareText(params: {
  activityId: number | string;
  author?: string;
  content?: string;
}) {
  const url = getTeaPostShareUrl(params.activityId);
  const preview = String(params.content ?? '').trim();
  const clipped =
    preview.length > 120 ? `${preview.slice(0, 117)}...` : preview;

  return clipped
    ? `${params.author ?? 'Someone'} shared Tea: "${clipped}"\n\n${url}`
    : `${params.author ?? 'Someone'} shared Tea:\n\n${url}`;
}