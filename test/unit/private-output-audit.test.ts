import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const script = resolve('scripts/audit-private-output.mjs');

async function setup(output: string) {
  const root = await mkdtemp(join(tmpdir(), 'read-clip-audit-'));
  const dist = join(root, 'dist');
  const clips = join(root, 'clips');
  await mkdir(dist);
  await mkdir(clips);
  await writeFile(
    join(clips, 'private.md'),
    `---\ntitle: PRIVATE_TITLE_MARKER\nsource: test\ncreatedAt: "2026-01-01T00:00:00Z"\nprivate: true\n---\n\nPRIVATE_BODY_MARKER\n`,
  );
  await writeFile(join(dist, 'index.html'), output);
  return { dist, clips };
}

describe('private output audit', () => {
  it('fails without echoing a leaked private marker', async () => {
    const { dist, clips } = await setup('PRIVATE_TITLE_MARKER');
    try {
      await execFileAsync(process.execPath, [script, dist, clips]);
      throw new Error('audit unexpectedly passed');
    } catch (error) {
      const result = error as { code: number; stderr: string };
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('private.md');
      expect(result.stderr).toContain('index.html');
      expect(result.stderr).not.toContain('PRIVATE_TITLE_MARKER');
    }
  });

  it('passes when private content does not appear in output', async () => {
    const { dist, clips } = await setup('public text');
    const result = await execFileAsync(process.execPath, [script, dist, clips]);
    expect(result.stdout).toContain('Privacy audit passed');
  });
});
