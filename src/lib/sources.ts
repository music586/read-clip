import { Buffer } from 'node:buffer';

export type SourceClip = {
  data: { source: string; author?: string; createdAt: string };
  id: string;
};

export type SourceGroup<T extends SourceClip = SourceClip> = {
  key: string;
  source: string;
  author?: string;
  count: number;
  latestAt: string;
  clips: T[];
};

export const normalizeSourcePart = (value?: string): string =>
  (value ?? '').trim().replace(/\s+/g, ' ');

export function sourceKey(clip: { source: string; author?: string }): string {
  const identity = [normalizeSourcePart(clip.source), normalizeSourcePart(clip.author)];
  return Buffer.from(JSON.stringify(identity), 'utf8').toString('base64url');
}

export function groupBySource<T extends SourceClip>(clips: T[]): SourceGroup<T>[] {
  const groups = new Map<string, SourceGroup<T>>();

  for (const clip of clips) {
    const source = normalizeSourcePart(clip.data.source);
    const author = normalizeSourcePart(clip.data.author) || undefined;
    const key = sourceKey({ source, author });
    const group = groups.get(key);
    if (group) {
      group.clips.push(clip);
      group.count += 1;
      if (Date.parse(clip.data.createdAt) > Date.parse(group.latestAt)) group.latestAt = clip.data.createdAt;
    } else {
      groups.set(key, {
        key,
        source,
        author,
        count: 1,
        latestAt: clip.data.createdAt,
        clips: [clip],
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      clips: group.clips.toSorted(
        (a, b) => Date.parse(b.data.createdAt) - Date.parse(a.data.createdAt) || a.id.localeCompare(b.id),
      ),
    }))
    .sort((a, b) => a.source.localeCompare(b.source, 'zh-CN') || (a.author ?? '').localeCompare(b.author ?? '', 'zh-CN'));
}
