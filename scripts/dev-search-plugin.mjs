import { resolve, sep } from 'node:path';
import { createIndex, close } from 'pagefind';
import { generateMetadata } from './generate-metadata.mjs';

// Dev serves rendered pages directly, so there is no dist/ for the Pagefind CLI.
// Index those same article pages on demand and serve Pagefind's bundle in memory.
export function devSearchPlugin() {
  return {
    name: 'read-clip-dev-search',
    apply: 'serve',
    configureServer(server) {
      const base = server.config.base.replace(/\/$/, '');
      const contentRoot = resolve(server.config.root, 'src/content/clips') + sep;
      let pending;
      let files;
      let revision = 0;
      let builtRevision = -1;

      const invalidate = (path) => {
        if (resolve(path).startsWith(contentRoot) || resolve(path) === resolve('src/data/tags.json')) revision++;
      };
      server.watcher.on('add', invalidate).on('change', invalidate).on('unlink', invalidate);
      server.httpServer?.once('close', () => {
        server.watcher.off('add', invalidate).off('change', invalidate).off('unlink', invalidate);
        void close();
      });

      async function buildIndex() {
        const address = server.httpServer?.address();
        if (!address || typeof address === 'string') throw new Error('Dev server is not listening');
        const hostname = address.address === '::' ? '[::1]' : address.address === '0.0.0.0' ? '127.0.0.1' : address.address.includes(':') ? `[${address.address}]` : address.address;
        const origin = `http://${hostname}:${address.port}`;
        const clips = await generateMetadata();
        const { index, errors } = await createIndex();
        if (!index || errors.length) throw new Error(errors.join('\n') || 'Could not create search index');
        try {
          for (const clip of clips) {
            const url = `/clips/${clip.id}/`;
            const response = await fetch(`${origin}${base}${url}`);
            if (!response.ok) throw new Error(`Cannot index ${url}: HTTP ${response.status}`);
            const result = await index.addHTMLFile({ url, content: await response.text() });
            if (result.errors.length) throw new Error(result.errors.join('\n'));
          }
          const result = await index.getFiles();
          if (result.errors.length) throw new Error(result.errors.join('\n'));
          return new Map(result.files.map(file => [file.path, Buffer.from(file.content)]));
        } finally {
          await index.deleteIndex();
        }
      }

      async function getFiles() {
        if (files && builtRevision === revision) return files;
        if (!pending) {
          const buildingRevision = revision;
          pending = buildIndex().then(result => {
            files = result;
            builtRevision = buildingRevision;
            return result;
          }).finally(() => { pending = undefined; });
        }
        return pending;
      }

      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        const prefix = pathname.startsWith(`${base}/_pagefind/`) ? `${base}/_pagefind/` : '/_pagefind/';
        if (!pathname.startsWith(prefix)) return next();
        try {
          const path = pathname.slice(prefix.length);
          const content = (await getFiles()).get(path);
          if (!content) { response.statusCode = 404; return response.end('Not Found'); }
          const type = path.endsWith('.js') ? 'text/javascript' : path.endsWith('.json') ? 'application/json' : path.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream';
          response.setHeader('Content-Type', type);
          response.setHeader('Cache-Control', 'no-store');
          response.end(content);
        } catch (error) {
          server.config.logger.error(`[dev-search] ${error instanceof Error ? error.message : error}`);
          response.statusCode = 500;
          response.end('Search index generation failed');
        }
      });
    },
  };
}
