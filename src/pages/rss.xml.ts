import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { clipPath, excerpt, getPublicClips } from '../lib/clips';
import { withBase } from '../lib/urls';

export const GET: APIRoute = async (context) => {
  const clips = await getPublicClips();
  return rss({
    title: '阅读摘抄',
    description: '按时间整理的公开阅读摘抄。',
    site: context.site ?? context.url.origin,
    items: clips.map((clip) => ({
      title: clip.data.title,
      pubDate: new Date(clip.data.createdAt),
      link: withBase(clipPath(clip.id)),
      description: `${clip.data.source}${clip.data.author ? `，${clip.data.author}` : ''} — ${excerpt(clip.body ?? '', 240)}`,
    })),
    customData: '<language>zh-CN</language>',
  });
};
