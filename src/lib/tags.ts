import { Buffer } from 'node:buffer';
import type { ClipEntry } from './clips';
import { sortClips } from './clips';

export interface TagGroup {
  tag: string;
  key: string;
  count: number;
  clips: ClipEntry[];
}

export const tagKey = (tag: string): string => Buffer.from(tag.trim(), 'utf8').toString('base64url');
export const tagPath = (tag: string): string => `/tags/${tagKey(tag)}/`;

export function groupByTag(clips: ClipEntry[]): TagGroup[] {
  const groups = new Map<string, TagGroup>();
  for (const clip of clips) {
    for (const tag of new Set(clip.data.tags.map((item) => item.trim()).filter(Boolean))) {
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
    .map((group) => ({ ...group, clips: sortClips(group.clips) }))
    .toSorted((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'));
}
