import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const endpoint = '/__read-clip/admin/tags';
const output = resolve('src/data/tags.json');

function normalizeTags(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('标签数据格式无效');
  return Object.fromEntries(Object.entries(value).flatMap(([path, tags]) => {
    if (!/\.mdx?$/i.test(path) || !Array.isArray(tags)) throw new Error(`标签记录无效：${path}`);
    const clean = [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))].toSorted();
    return clean.length ? [[path, clean]] : [];
  }));
}

export function adminTagsPlugin() {
  return {
    name: 'read-clip-admin-tags',
    configureServer(server) {
      server.middlewares.use(endpoint, async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405;
          return response.end('Method Not Allowed');
        }
        try {
          const chunks = [];
          for await (const chunk of request) chunks.push(chunk);
          const tags = normalizeTags(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          const temporary = `${output}.tmp`;
          await mkdir(dirname(output), { recursive: true });
          await writeFile(temporary, `${JSON.stringify(tags, null, 2)}\n`);
          await rename(temporary, output);
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.end(JSON.stringify({ ok: true }));
        } catch (error) {
          response.statusCode = 400;
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.end(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : '保存失败' }));
        }
      });
    },
  };
}
