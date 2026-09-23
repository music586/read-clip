import { sortClips, type ClipEntry } from './clips';

const monthFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: '2-digit', timeZone: 'Asia/Shanghai',
});

export function monthKey(date: string): string {
  const parts = monthFormatter.formatToParts(new Date(date));
  return `${parts.find(p => p.type === 'year')!.value}-${parts.find(p => p.type === 'month')!.value}`;
}

export const monthLabel = (key: string): string => `${key.slice(0, 4)} 年 ${Number(key.slice(5))} 月`;
export const monthPath = (key: string): string => `/dates/${key}/`;

export function groupByMonth(clips: ClipEntry[]) {
  const groups = new Map<string, ClipEntry[]>();
  for (const clip of sortClips(clips)) {
    const key = monthKey(clip.data.createdAt);
    const group = groups.get(key) ?? [];
    group.push(clip);
    groups.set(key, group);
  }
  return [...groups].map(([key, clips]) => ({ key, clips, count: clips.length }))
    .toSorted((a, b) => b.key.localeCompare(a.key));
}
