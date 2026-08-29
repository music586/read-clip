import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const clipsRoot = join(projectRoot, 'src/content/clips');
const outputFile = join(projectRoot, '.read-clip/generated/clips.json');
const tagsFile = join(projectRoot, 'src/data/tags.json');

export const normalizeBody = (body) => body.replace(/\r\n?/g, '\n').trim();

export function metadataId(contentPath) {
  return createHash('sha256').update(contentPath.normalize('NFC')).digest('hex').slice(0, 16);
}

export function titleFrom(body, contentPath) {
  const normalized = normalizeBody(body);
  const atxHeading = normalized.match(/^#{1,6}\s+(.+)$/m)?.[1]?.trim();
  if (atxHeading) return atxHeading.replace(/\s+#+$/, '').trim();
  const setextHeading = normalized.match(/^([^\n]+)\n(?:=+|-+)\s*$/m)?.[1]?.trim();
  if (setextHeading) return setextHeading;
  const fileTitle = basename(contentPath, extname(contentPath)).replace(/[-_]+/g, ' ').trim();
  if (fileTitle) return fileTitle;
  const firstSentence = normalized.split(/(?<=[。！？.!?])\s*|\n+/)[0]?.trim();
  return firstSentence?.slice(0, 40) || '未命名摘抄';
}

export function directoryFrom(contentPath) {
  const directory = dirname(contentPath).replace(/\\/g, '/');
  return directory === '.' ? undefined : directory;
}

export function contentHash(body) {
  return `sha256:${createHash('sha256').update(normalizeBody(body)).digest('hex')}`;
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(fullPath));
    else if (/\.mdx?$/i.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function gitCreatedAt(absolutePath) {
  const path = relative(projectRoot, absolutePath).split(sep).join('/');
  try {
    const dates = execFileSync('git', ['log', '--follow', '--format=%aI', '--', path], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().split('\n').filter(Boolean);
    return dates.at(-1);
  } catch {
    return undefined;
  }
}

export async function generateMetadata({ root = clipsRoot, output = outputFile } = {}) {
  const files = await markdownFiles(root);
  let tagsByPath = {};
  try {
    tagsByPath = JSON.parse(await readFile(tagsFile, 'utf8'));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  const clips = [];
  const hashes = new Map();

  for (const absolutePath of files.toSorted()) {
    const body = await readFile(absolutePath, 'utf8');
    // Editors such as Obsidian create the file before inserting clipboard content.
    // Treat that short-lived empty state as a draft and include it on the next scan.
    if (!normalizeBody(body)) continue;
    const contentPath = relative(root, absolutePath).split(sep).join('/');
    const hash = contentHash(body);
    const duplicate = hashes.get(hash);
    if (duplicate) throw new Error(`Duplicate clip content: ${duplicate} and ${contentPath}`);
    hashes.set(hash, contentPath);
    const info = await stat(absolutePath);
    clips.push({
      version: 1,
      id: metadataId(contentPath),
      contentPath,
      createdAt: gitCreatedAt(absolutePath) ?? info.birthtime.toISOString(),
      updatedAt: info.mtime.toISOString(),
      title: titleFrom(body, contentPath),
      contentHash: hash,
      tags: Array.isArray(tagsByPath[contentPath]) ? [...new Set(tagsByPath[contentPath].map(String).map((tag) => tag.trim()).filter(Boolean))].toSorted() : [],
      ...(directoryFrom(contentPath) ? { directory: directoryFrom(contentPath) } : {}),
    });
  }

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify({ version: 1, clips }, null, 2)}\n`);
  return clips;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const clips = await generateMetadata();
  console.log(`Generated metadata for ${clips.length} clip(s).`);
}
