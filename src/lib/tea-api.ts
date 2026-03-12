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
    filtered.map((item:any) =>
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
    content: trimmed || (mediaIds.length || videoIds.length ? "." : ""),
  };

  if (mediaIds.length) {
    payload.bp_media_ids = mediaIds;
  }

  if (videoIds.length) {
    payload.bp_videos = videoIds;
  }

  return apiPost("/activity", payload);
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
