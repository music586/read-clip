import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  contentHash,
  generateMetadata,
  metadataId,
  directoryFrom,
  titleFrom,
} from '../../scripts/generate-metadata.mjs';

describe('metadata generation', () => {
  it('derives deterministic metadata from arbitrary paths and pure Markdown', async () => {
    const root = await mkdtemp(join(tmpdir(), 'read-clip-'));
    const nested = join(root, '任意目录', '一本书');
    const output = join(root, '.generated', 'clips.json');
    await mkdir(nested, { recursive: true });
    await writeFile(join(nested, '随意文件名.md'), '# 自动标题\n\n纯正文。\n');

    const clips = await generateMetadata({ root, output });
    const saved = JSON.parse(await readFile(output, 'utf8'));
    expect(clips[0]).toMatchObject({
      id: metadataId('任意目录/一本书/随意文件名.md'),
      contentPath: '任意目录/一本书/随意文件名.md',
      title: '自动标题',
      directory: '任意目录/一本书',
      contentHash: contentHash('# 自动标题\n\n纯正文。\n'),
    });
    expect(saved.clips).toHaveLength(1);
  });

  it('uses the filename as title and records the objective directory path', () => {
    expect(titleFrom('没有标题的正文', '资料/文件名称.md')).toBe('文件名称');
    expect(directoryFrom('资料/文件名称.md')).toBe('资料');
    expect(directoryFrom('文件名称.md')).toBeUndefined();
  });

  it('rejects duplicate normalized content', async () => {
    const root = await mkdtemp(join(tmpdir(), 'read-clip-'));
    await writeFile(join(root, 'a.md'), '相同正文\n');
    await writeFile(join(root, 'b.md'), '\n相同正文\n');
    await expect(generateMetadata({ root, output: join(root, 'clips.json') })).rejects.toThrow(
      /Duplicate clip content: a\.md and b\.md/,
    );
  });

  it('includes a Markdown file added after an earlier metadata pass', async () => {
    const root = await mkdtemp(join(tmpdir(), 'read-clip-'));
    const output = join(root, '.generated', 'clips.json');
    await writeFile(join(root, 'first.md'), '第一条正文');
    await generateMetadata({ root, output });
    await writeFile(join(root, 'later.md'), '运行期间新增的正文');

    const clips = await generateMetadata({ root, output });
    expect(clips.map((clip) => clip.contentPath)).toEqual(['first.md', 'later.md']);
  });
});
