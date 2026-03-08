import { useAuthStore } from '../store/auth-store';

const API_BASE = 'https://everythingdid.com/wp-json/buddyboss/v1';

export type ForumRow = {
  id: number;
  title: string;
};

export type TopicRow = {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  time: string;
  replyCount: number;
  forumId?: number;
};

export type SimpleTopicRow = {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  time: string;
  replyCount: number;
};

export type ReplyRow = {
  id: number;
  text: string;
  author: string;
  time: string;
  authorId?: number;
};

export type TopicDetail = {
  id: number;
  title: string;
  content: string;
  author: string;
  time: string;
  replyCount: number;
  replies: ReplyRow[];
};

function htmlToText(html: string) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&#0*38;|&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function pickAuthorName(obj: any): string {
  return String(
    obj?.author_name ??
      obj?.display_name ??
      obj?.topic_author ??
      obj?.reply_author ??
      obj?.author?.name ??
      obj?.author?.display_name ??
      obj?.user_data?.name ??
      obj?.user_name ??
      obj?._embedded?.author?.[0]?.name ??
      ''
  ).trim();
}

function pickAuthorId(obj: any): number {
  return Number(
    obj?.author_id ??
      obj?.author ??
      obj?.user_id ??
      obj?.poster_id ??
      0
  );
}

function fallbackAuthor(obj: any): string {
  const name = pickAuthorName(obj);
  if (name) return name;

  const id = pickAuthorId(obj);
  if (id) return `User ${id}`;

  return 'Unknown';
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

  if (!res.ok) {
    const raw = await res.json().catch(() => null);
    throw new Error(raw?.message || 'Request failed');
  }

  return res.json();
}

async function apiPost(path: string, payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authedHeaders()),
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(raw?.message || 'Request failed');
  }

  return raw;
}

async function fetchMemberMap(ids: number[]): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(ids.filter((id) => Number(id) > 0))];
  const map = new Map<number, string>();

  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const member = await apiGet(`/members/${id}`);
        const name = String(
          member?.name ??
            member?.display_name ??
            member?.user?.name ??
            member?.user?.display_name ??
            ''
        ).trim();

        if (name) {
          map.set(id, name);
        }
      } catch {
        // Ignore invalid or non-member IDs
      }
    })
  );

  return map;
}

async function fetchAccurateReplyCount(topicId: number): Promise<number> {
  if (!topicId) return 0;

  const repliesRaw = await apiGet(
    `/reply?topic_id=${topicId}&per_page=100&order=asc`
  ).catch(() => []);

  const repliesArr = Array.isArray(repliesRaw) ? repliesRaw : [];

  return repliesArr.filter((r: any) => {
    const replyTopicId = Number(r?.topic_id ?? r?.parent?.id ?? r?.parent ?? 0);
    return replyTopicId === topicId;
  }).length;
}

export async function fetchForums(): Promise<ForumRow[]> {
  const raw = await apiGet('/forums?per_page=50');
  const arr = Array.isArray(raw) ? raw : [];

  return arr.map((f: any) => ({
    id: Number(f?.id ?? 0),
    title:
      htmlToText(f?.title?.rendered ?? '') ||
      String(f?.title ?? '') ||
      'Forum',
  }));
}

export async function fetchTopics(params?: {
  forumId?: number | null;
  search?: string;
  sort?: 'latest' | 'trending';
}): Promise<TopicRow[]> {
  const qs = new URLSearchParams();
  qs.set('per_page', '30');

  if (params?.forumId) qs.set('parent', String(params.forumId));
  if (params?.search) qs.set('search', params.search);

  if (params?.sort === 'trending') {
    qs.set('orderby', 'popular');
    qs.set('order', 'desc');
  } else {
    qs.set('orderby', 'date');
    qs.set('order', 'desc');
  }

  const raw = await apiGet(`/topics?${qs.toString()}`);
  const arr = Array.isArray(raw) ? raw : [];

  const authorIds = arr.map((t: any) => pickAuthorId(t)).filter(Boolean);
  const memberMap = await fetchMemberMap(authorIds);

  const counts = await Promise.all(
    arr.map((t: any) => fetchAccurateReplyCount(Number(t?.id ?? 0)))
  );

  return arr.map((t: any, index: number) => {
    const authorId = pickAuthorId(t);

    return {
      id: Number(t?.id ?? 0),
      title:
        htmlToText(t?.title?.rendered ?? '') ||
        String(t?.title ?? '') ||
        'Untitled Thread',
      excerpt:
        htmlToText(t?.excerpt?.rendered ?? '') ||
        htmlToText(t?.content?.rendered ?? '') ||
        '',
      author:
        pickAuthorName(t) ||
        memberMap.get(authorId) ||
        fallbackAuthor(t),
      time: String(t?.date ?? t?.modified ?? ''),
      replyCount: counts[index] ?? 0,
      forumId: Number(t?.parent ?? 0),
    };
  });
}

export async function fetchTopicDetail(topicId: number | string): Promise<TopicDetail> {
  const topic = await apiGet(`/topics/${topicId}`);
  const repliesRaw = await apiGet(
    `/reply?topic_id=${topicId}&per_page=100&order=asc`
  ).catch(() => []);

  const repliesArr = Array.isArray(repliesRaw) ? repliesRaw : [];

  const filteredReplies = repliesArr.filter((r: any) => {
    const replyTopicId = Number(r?.topic_id ?? r?.parent?.id ?? r?.parent ?? 0);
    return replyTopicId === Number(topicId);
  });

  const authorIds = [
    pickAuthorId(topic),
    ...filteredReplies.map((r: any) => pickAuthorId(r)),
  ].filter(Boolean);

  const memberMap = await fetchMemberMap(authorIds);
  const topicAuthorId = pickAuthorId(topic);

  return {
    id: Number(topic?.id ?? 0),
    title:
      htmlToText(topic?.title?.rendered ?? '') ||
      String(topic?.title ?? '') ||
      'Untitled Thread',
    content:
      htmlToText(topic?.content?.rendered ?? '') ||
      htmlToText(topic?.content?.raw ?? '') ||
      '',
    author:
      pickAuthorName(topic) ||
      memberMap.get(topicAuthorId) ||
      fallbackAuthor(topic),
    time: String(topic?.date ?? topic?.modified ?? ''),
    replyCount: filteredReplies.length,
    replies: filteredReplies.map((r: any) => {
      const authorId = pickAuthorId(r);

      return {
        id: Number(r?.id ?? 0),
        text:
          htmlToText(r?.content?.rendered ?? '') ||
          htmlToText(r?.content?.raw ?? '') ||
          '',
        author:
          pickAuthorName(r) ||
          memberMap.get(authorId) ||
          fallbackAuthor(r),
        time: String(r?.date ?? r?.modified ?? ''),
        authorId,
      };
    }),
  };
}

export async function createThread({
  parent,
  title,
  content,
}: {
  parent: number | null;
  title: string;
  content: string;
}) {
  return apiPost('/topics', {
    parent: Number(parent),
    title,
    content,
    status: 'publish',
  });
}

export async function fetchSubscribedThreads(): Promise<SimpleTopicRow[]> {
  const raw = await apiGet('/subscriptions?type=topic&per_page=50').catch(() => []);
  const arr = Array.isArray(raw) ? raw : [];

  const itemIds = arr
    .map((s: any) => Number(s?.item_id ?? 0))
    .filter(Boolean);

  if (!itemIds.length) return [];

  const topics = await Promise.all(
    itemIds.map(async (id) => {
      try {
        return await apiGet(`/topics/${id}`);
      } catch {
        return null;
      }
    })
  );

  const cleanTopics = topics.filter(Boolean);
  const authorIds = cleanTopics.map((t: any) => pickAuthorId(t)).filter(Boolean);
  const memberMap = await fetchMemberMap(authorIds);
  const counts = await Promise.all(
    cleanTopics.map((t: any) => fetchAccurateReplyCount(Number(t?.id ?? 0)))
  );

  return cleanTopics.map((t: any, index: number) => {
    const authorId = pickAuthorId(t);

    return {
      id: Number(t?.id ?? 0),
      title:
        htmlToText(t?.title?.rendered ?? '') ||
        String(t?.title ?? '') ||
        'Untitled Thread',
      excerpt:
        htmlToText(t?.excerpt?.rendered ?? '') ||
        htmlToText(t?.content?.rendered ?? '') ||
        '',
      author:
        pickAuthorName(t) ||
        memberMap.get(authorId) ||
        fallbackAuthor(t),
      time: String(t?.date ?? t?.modified ?? ''),
      replyCount: counts[index] ?? 0,
    };
  });
}

export async function fetchTopicsByIds(ids: number[]): Promise<SimpleTopicRow[]> {
  const uniqueIds = [...new Set(ids.map(Number).filter(Boolean))];
  if (!uniqueIds.length) return [];

  const topics = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        return await apiGet(`/topics/${id}`);
      } catch {
        return null;
      }
    })
  );

  const cleanTopics = topics.filter(Boolean);
  const authorIds = cleanTopics.map((t: any) => pickAuthorId(t)).filter(Boolean);
  const memberMap = await fetchMemberMap(authorIds);
  const counts = await Promise.all(
    cleanTopics.map((t: any) => fetchAccurateReplyCount(Number(t?.id ?? 0)))
  );

  return cleanTopics.map((t: any, index: number) => {
    const authorId = pickAuthorId(t);

    return {
      id: Number(t?.id ?? 0),
      title:
        htmlToText(t?.title?.rendered ?? '') ||
        String(t?.title ?? '') ||
        'Untitled Thread',
      excerpt:
        htmlToText(t?.excerpt?.rendered ?? '') ||
        htmlToText(t?.content?.rendered ?? '') ||
        '',
      author:
        pickAuthorName(t) ||
        memberMap.get(authorId) ||
        fallbackAuthor(t),
      time: String(t?.date ?? t?.modified ?? ''),
      replyCount: counts[index] ?? 0,
    };
  });
}

export async function postReply({
  topicId,
  content,
  mediaIds = [],
}: {
  topicId: number | string;
  content: string;
  mediaIds?: number[];
}) {
  const payload: Record<string, any> = {
    topic_id: Number(topicId),
    content: String(content).trim(),
  };

  if (mediaIds.length) {
    payload.bbp_media = mediaIds;
  }

  return apiPost('/reply', payload);
}

export async function deleteReply(replyId: number | string) {
  const res = await fetch(`${API_BASE}/reply/${replyId}`, {
    method: 'DELETE',
    headers: {
      ...(await authedHeaders()),
    },
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(raw?.message || 'Could not delete reply.');
  }

  return raw;
}

export async function updateReply({
  replyId,
  topicId,
  content,
}: {
  replyId: number | string;
  topicId: number | string;
  content: string;
}) {
  return apiPost(`/reply/${replyId}`, {
    topic_id: Number(topicId),
    content: String(content).trim(),
  });
}