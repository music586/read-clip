import { Buffer } from 'node:buffer';

export type TagClip = {
  data: { tags: string[]; createdAt: string };
  id: string;
};

export type TagGroup<T extends TagClip = TagClip> = {
  tag: string;
  key: string;
  count: number;
  clips: T[];
};

export const tagKey = (tag: string): string => Buffer.from(tag.trim(), 'utf8').toString('base64url');

export function groupByTag<T extends TagClip>(clips: T[]): TagGroup<T>[] {
  const groups = new Map<string, TagGroup<T>>();
  for (const clip of clips) {
    const uniqueTags = new Set(clip.data.tags.map((tag) => tag.trim()).filter(Boolean));
    for (const tag of uniqueTags) {
      const key = tagKey(tag);
      const group = groups.get(key);
      if (group) {
        group.clips.push(clip);
        group.count += 1;
      } else {
        groups.set(key, { tag, key, count: 1, clips: [clip] });
      }
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      clips: group.clips.toSorted(
        (a, b) => Date.parse(b.data.createdAt) - Date.parse(a.data.createdAt) || a.id.localeCompare(b.id),
      ),
    }))
    .sort((a, b) => a.tag.localeCompare(b.tag, 'zh-CN'));
}
