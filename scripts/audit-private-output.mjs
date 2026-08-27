#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const TEXT_EXTENSIONS = new Set(['.html', '.xml', '.js', '.json', '.css', '.txt', '.svg', '.map']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const normalizeBody = (body) => body.replace(/\r\n/g, '\n').trim();
const fingerprint = (value) => createHash('sha256').update(value).digest('hex');

export async function auditPrivateOutput(distDirectory, clipsDirectory) {
  const dist = resolve(distDirectory);
  const clips = resolve(clipsDirectory);
  if (!(await stat(dist)).isDirectory()) throw new Error(`Output directory does not exist: ${dist}`);
  if (!(await stat(clips)).isDirectory()) throw new Error(`Clips directory does not exist: ${clips}`);

  const privateRecords = [];
  for (const file of await walk(clips)) {
    if (!/\.mdx?$/i.test(file)) continue;
    const raw = await readFile(file, 'utf8');
    const parsed = matter(raw);
    if (parsed.data.private !== true) continue;
    const title = typeof parsed.data.title === 'string' ? parsed.data.title.trim() : '';
    const body = normalizeBody(parsed.content);
    privateRecords.push({
      id: relative(clips, file),
      values: [title, body, body ? fingerprint(body) : ''].filter(Boolean),
    });
  }

  const leaks = [];
  for (const output of await walk(dist)) {
    if (!TEXT_EXTENSIONS.has(extname(output).toLowerCase())) continue;
    const content = await readFile(output, 'utf8');
    for (const record of privateRecords) {
      if (record.values.some((value) => content.includes(value))) {
        leaks.push({ privateId: record.id, output: relative(dist, output) });
      }
    }
  }

  if (leaks.length > 0) {
    for (const leak of leaks) {
      console.error(`Private content leak: ${leak.privateId} -> ${leak.output}`);
    }
    return { ok: false, privateCount: privateRecords.length, leaks };
  }

  console.log(`Privacy audit passed: ${privateRecords.length} private clip(s), no output leaks.`);
  return { ok: true, privateCount: privateRecords.length, leaks: [] };
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const [distDirectory, clipsDirectory] = process.argv.slice(2);
  if (!distDirectory || !clipsDirectory) {
    console.error('Usage: node scripts/audit-private-output.mjs <dist-dir> <clips-dir>');
    process.exitCode = 2;
  } else {
    try {
      const result = await auditPrivateOutput(distDirectory, clipsDirectory);
      if (!result.ok) process.exitCode = 1;
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 2;
    }
  }
}
