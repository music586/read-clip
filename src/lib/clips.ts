import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';

export interface ClipMetadata {
  version: 1;
  id: string;
  contentPath: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  contentHash: string;
  tags: string[];
  directory?: string;
}

export type ClipEntry = Omit<CollectionEntry<'clips'>, 'id' | 'data'> & {
  id: string;
  sourceId: string;
  data: ClipMetadata;
};

export const sortClips = <T extends { id: string; data: { createdAt: string } }>(clips: T[]): T[] =>
  clips.toSorted(
    (a, b) => Date.parse(b.data.createdAt) - Date.parse(a.data.createdAt) || a.id.localeCompare(b.id),
  );

export function clipPath(id: string): string {
  return `/clips/${encodeURIComponent(id)}/`;
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
  return plain.length <= limit ? plain : `${plain.slice(0, Math.max(1, limit - 1)).trimEnd()}…`;
}

export async function getClips(): Promise<ClipEntry[]> {
  execFileSync(process.execPath, ['scripts/generate-metadata.mjs'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
  const catalog = JSON.parse(
    await readFile(resolve('.read-clip/generated/clips.json'), 'utf8'),
  ) as { clips: ClipMetadata[] };
  const metadataByPath = new Map(catalog.clips.map((item) => [item.contentPath, item]));
  const entries = await getCollection('clips');

  const clips = entries.flatMap((entry) => {
    const sourceId = entry.id.replace(/\\/g, '/');
    const metadata = metadataByPath.get(sourceId);
    if (!entry.body?.trim()) return [];
    if (!metadata) throw new Error(`Missing generated metadata: ${entry.id}`);
    return [{ ...entry, id: metadata.id, sourceId: entry.id, data: metadata } as ClipEntry];
  });

  if (clips.length !== catalog.clips.length) {
    throw new Error('Generated metadata is out of sync with Markdown content');
  }
  return sortClips(clips);
}
