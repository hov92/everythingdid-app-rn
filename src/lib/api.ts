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

export type ReplyRow = {
  id: number;
  text: string;
  author: string;
  time: string;
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

  return arr.map((t: any) => ({
    id: Number(t?.id ?? 0),
    title:
      htmlToText(t?.title?.rendered ?? '') ||
      String(t?.title ?? '') ||
      'Untitled Thread',
    excerpt:
      htmlToText(t?.excerpt?.rendered ?? '') ||
      htmlToText(t?.content?.rendered ?? '') ||
      '',
    author: String(
      t?.author_name ??
        t?.author?.name ??
        t?._embedded?.author?.[0]?.name ??
        t?.topic_author ??
        t?.display_name ??
        'Unknown'
    ),
    time: String(t?.date ?? t?.modified ?? ''),
    replyCount: Number(t?.reply_count ?? t?.replies ?? 0),
    forumId: Number(t?.parent ?? 0),
  }));
}

export async function fetchTopicDetail(topicId: number | string): Promise<TopicDetail> {
  const topic = await apiGet(`/topics/${topicId}`);
  const repliesRaw = await apiGet(`/reply?topic_id=${topicId}&per_page=100&order=asc`).catch(
    () => []
  );

  const repliesArr = Array.isArray(repliesRaw) ? repliesRaw : [];

  const filteredReplies = repliesArr.filter((r: any) => {
    const replyTopicId = Number(r?.topic_id ?? r?.parent?.id ?? r?.parent ?? 0);
    return replyTopicId === Number(topicId);
  });

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
    author: String(
      topic?.author_name ??
        topic?.author?.name ??
        topic?.topic_author ??
        'Unknown'
    ),
    time: String(topic?.date ?? topic?.modified ?? ''),
    replyCount: Number(topic?.reply_count ?? filteredReplies.length ?? 0),
    replies: filteredReplies.map((r: any) => ({
      id: Number(r?.id ?? 0),
      text:
        htmlToText(r?.content?.rendered ?? '') ||
        htmlToText(r?.content?.raw ?? '') ||
        '',
      author: String(
        r?.author_name ??
          r?.author?.name ??
          r?.display_name ??
          'Unknown'
      ),
      time: String(r?.date ?? r?.modified ?? ''),
    })),
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
    payload['bbp_media'] = mediaIds;
  }

  return apiPost('/reply', payload);
}