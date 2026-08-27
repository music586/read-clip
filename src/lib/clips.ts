import { getCollection, type CollectionEntry } from 'astro:content';

export type ClipEntry = CollectionEntry<'clips'>;

export const publicProjection = <T extends { data: { private: boolean; createdAt: string }; id: string }>(
  clips: T[],
): T[] =>
  clips
    .filter((clip) => !clip.data.private)
    .toSorted(
      (a, b) =>
        Date.parse(b.data.createdAt) - Date.parse(a.data.createdAt) || a.id.localeCompare(b.id),
    );

export function clipPath(id: string): string {
  const path = id.replace(/\.(?:md|mdx)$/i, '');
  return `/clips/${path.split('/').filter(Boolean).map(encodeURIComponent).join('/')}/`;
}

export function excerpt(body: string, limit = 150): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+\.)\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= limit) return plain;
  return `${plain.slice(0, Math.max(1, limit - 1)).trimEnd()}…`;
}

export function assertValidClipBodies<T extends { id: string; body?: string }>(clips: T[]): void {
  for (const clip of clips) {
    if (!clip.body?.trim()) throw new Error(`Empty clip body: ${clip.id}`);
  }
}

export function assertUniqueClipPaths<T extends { id: string }>(clips: T[]): void {
  const paths = new Map<string, string>();
  for (const clip of clips) {
    const path = clipPath(clip.id).normalize('NFC').toLocaleLowerCase('en-US');
    const existing = paths.get(path);
    if (existing) {
      throw new Error(`Duplicate clip path for ${existing} and ${clip.id}`);
    }
    paths.set(path, clip.id);
  }
}

export async function getPublicClips(): Promise<ClipEntry[]> {
  const clips = await getCollection('clips');
  assertValidClipBodies(clips);
  assertUniqueClipPaths(clips);
  return publicProjection(clips);
}
