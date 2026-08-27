# Reading Clips Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Markdown-based reading-clips site that publishes only public clips to GitHub Pages and supports timeline, search, tags, sources, detail pages, RSS, and responsive themes.

**Architecture:** Astro reads one clip per Markdown file through a strict content schema. Pure TypeScript helpers create a public-only projection and aggregations; all pages, feeds, search indexing, and deployment consume that projection. GitHub Actions verifies the production output and pushes only static files to a separate public Pages repository.

**Tech Stack:** Astro, TypeScript, Zod via Astro Content Collections, Pagefind, Vitest, Playwright, GitHub Actions, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-08-28-reading-clips-site-design.md`

## Global Constraints

- One Markdown file represents one clip.
- Required fields are `title`, `source`, `createdAt`, and non-empty Markdown body.
- Optional fields are `author`, `url`, `tags`, and `private`; `tags` defaults to `[]` and `private` defaults to `false`.
- `createdAt` must include an explicit timezone offset or `Z`.
- Private clips must not enter HTML, Pagefind indexes, aggregations, RSS, sitemap, or social metadata.
- Source identity is normalized `source + author`; normalization trims ends and collapses whitespace only.
- The public site must run without a database or persistent server.
- The source repository is private; deployment publishes only generated static files to a separate public Pages repository.
- GitHub Pages project subpaths must work for assets, navigation, and internal links.
- External source-link availability must never block a build.

## Planned File Structure

```text
package.json                         scripts and pinned dependencies
astro.config.mjs                    site/base URL, sitemap, Pagefind integration
tsconfig.json                       strict Astro TypeScript settings
vitest.config.ts                    unit-test configuration
playwright.config.ts                production-preview browser tests
src/content.config.ts               clip schema and timezone validation
src/content/clips/...               Markdown clips and authoring example
src/lib/clips.ts                    public projection, sorting, slug and excerpt helpers
src/lib/sources.ts                  source normalization and aggregation
src/lib/urls.ts                     base-aware URL helper
src/components/...                  focused navigation, card, search, and theme controls
src/layouts/SiteLayout.astro        metadata and global page shell
src/pages/...                       timeline, tags, sources, clip details, RSS
src/styles/global.css               responsive reading-oriented visual system
public/favicon.svg                  site icon
scripts/audit-private-output.mjs    second-line privacy audit
test/unit/...                       schema and pure-helper tests
test/e2e/site.spec.ts               rendered-site browser checks
.github/workflows/deploy.yml        verify, build, audit, and publish pipeline
README.md                           authoring and deployment instructions
```

---

### Task 1: Astro Foundation and Strict Clip Schema

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/content.config.ts`
- Create: `src/content/clips/2026/08/2026-08-28-reading-as-thinking.md`
- Create: `test/unit/content-schema.test.ts`
- Create: `public/favicon.svg`

**Interfaces:**
- Produces: Astro collection `clips` with fields `{ title, source, author?, url?, tags, createdAt, private }`.
- Produces: `hasExplicitTimezone(value: string): boolean` for schema validation.

- [ ] **Step 1: Create the project manifest and test configuration**

Create scripts with these exact responsibilities:

```json
{
  "name": "read-clip",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build && pagefind --site dist",
    "preview": "astro preview",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "check": "astro check && vitest run"
  }
}
```

Install runtime packages `astro`, `@astrojs/sitemap`, and dev packages `@astrojs/check`, `typescript`, `vitest`, `pagefind`, `@playwright/test`. Commit the generated lockfile. Configure Vitest for `test/unit/**/*.test.ts` and Astro TypeScript with `"extends": "astro/tsconfigs/strict"`.

- [ ] **Step 2: Write failing schema tests**

Export the schema helper so the tests can parse representative objects:

```ts
import { describe, expect, it } from 'vitest';
import { clipSchema, hasExplicitTimezone } from '../../src/content.config';

describe('clip schema', () => {
  it('accepts a minimal public clip and applies defaults', () => {
    const result = clipSchema.parse({
      title: '阅读也是一种思考',
      source: '如何阅读一本书',
      createdAt: '2026-08-28T20:30:00+08:00',
    });
    expect(result.tags).toEqual([]);
    expect(result.private).toBe(false);
  });

  it.each(['2026-08-28', '2026-08-28T20:30:00'])('rejects a date without timezone: %s', (createdAt) => {
    expect(() => clipSchema.parse({ title: 'x', source: 'y', createdAt })).toThrow();
  });

  it('rejects invalid URLs and blank required strings', () => {
    expect(() => clipSchema.parse({ title: ' ', source: 'x', url: 'nope', createdAt: '2026-08-28T12:00:00Z' })).toThrow();
  });
});

describe('hasExplicitTimezone', () => {
  it('accepts Z and numeric offsets', () => {
    expect(hasExplicitTimezone('2026-08-28T12:00:00Z')).toBe(true);
    expect(hasExplicitTimezone('2026-08-28T20:00:00+08:00')).toBe(true);
  });
});
```

- [ ] **Step 3: Run the schema test and confirm failure**

Run: `npm test -- test/unit/content-schema.test.ts`

Expected: FAIL because `src/content.config.ts` does not exist.

- [ ] **Step 4: Implement the strict collection schema**

Use `defineCollection`, `z`, and `glob` from Astro. Define:

```ts
export const hasExplicitTimezone = (value: string): boolean =>
  /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);

export const clipSchema = z.object({
  title: z.string().trim().min(1),
  source: z.string().trim().min(1),
  author: z.string().trim().min(1).optional(),
  url: z.string().url().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  createdAt: z.string().datetime({ offset: true }).refine(hasExplicitTimezone),
  private: z.boolean().default(false),
});
```

Bind it to `src/content/clips/**/*.md`. Add the approved sample clip and an Astro config whose `site` and `base` read `SITE_URL` and `BASE_PATH`, with safe local defaults.

- [ ] **Step 5: Verify foundation and schema**

Run: `npm test -- test/unit/content-schema.test.ts && npm run build`

Expected: all unit tests PASS; Astro validates the sample collection and creates `dist/`.

- [ ] **Step 6: Commit the foundation**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts src/content.config.ts src/content/clips public/favicon.svg test/unit/content-schema.test.ts
git commit -m "feat: establish Astro clip content model"
```

### Task 2: Public Projection, Stable URLs, and Aggregations

**Files:**
- Create: `src/lib/clips.ts`
- Create: `src/lib/sources.ts`
- Create: `src/lib/urls.ts`
- Create: `test/unit/clips.test.ts`
- Create: `test/unit/sources.test.ts`
- Create: `test/unit/urls.test.ts`

**Interfaces:**
- Consumes: Astro `CollectionEntry<'clips'>`.
- Produces: `getPublicClips(): Promise<ClipEntry[]>`, sorted newest first.
- Produces: `clipPath(id: string): string`, `excerpt(body: string, limit?: number): string`, `assertValidClipBodies(clips): void`, and `assertUniqueClipPaths(clips): void`.
- Produces: `normalizeSourcePart(value?: string): string`, `sourceKey(clip): string`, and `groupBySource(clips): SourceGroup[]`.
- Produces: `withBase(path: string): string` for every internal URL.

- [ ] **Step 1: Write failing projection and aggregation tests**

Use small typed fixtures and assert these exact behaviors:

```ts
it('removes private clips and sorts public clips newest first', () => {
  expect(publicProjection(fixtures).map((clip) => clip.id)).toEqual(['new-public', 'old-public']);
});

it('normalizes source identity without fuzzy merging', () => {
  expect(normalizeSourcePart('  如何  阅读一本书 ')).toBe('如何 阅读一本书');
  expect(sourceKey({ source: '书名', author: '甲' })).not.toBe(sourceKey({ source: '书名', author: '乙' }));
});

it('creates a base-aware absolute site path', () => {
  expect(withBase('/tags/reading/', '/read-clip')).toBe('/read-clip/tags/reading/');
});
```

Also test empty authors, equal timestamps, Markdown removal in excerpts, URI-safe clip paths, group counts, and each group's latest date. Assert that an entry with whitespace-only `body` reports its file ID, and that two IDs mapping to the same normalized path throw an error naming both IDs.

- [ ] **Step 2: Run tests and confirm missing-module failures**

Run: `npm test -- test/unit/clips.test.ts test/unit/sources.test.ts test/unit/urls.test.ts`

Expected: FAIL because the three library modules do not exist.

- [ ] **Step 3: Implement minimal pure helpers**

Keep filtering centralized:

```ts
export const publicProjection = <T extends { data: { private: boolean; createdAt: string }; id: string }>(clips: T[]): T[] =>
  clips
    .filter((clip) => !clip.data.private)
    .toSorted((a, b) => b.data.createdAt.localeCompare(a.data.createdAt) || a.id.localeCompare(b.id));

export async function getPublicClips() {
  const clips = await getCollection('clips');
  assertValidClipBodies(clips);
  assertUniqueClipPaths(clips);
  return publicProjection(clips);
}
```

`assertValidClipBodies` trims each Markdown body and throws `Empty clip body: <id>` when empty. `assertUniqueClipPaths` computes every `clipPath`, detects collisions before page generation, and names both source IDs in its error. Implement source keys as a deterministic encoded pair, not a display string. Implement `withBase(path, base = import.meta.env.BASE_URL)` so callers never concatenate the Pages base themselves.

- [ ] **Step 4: Run helper tests**

Run: `npm test -- test/unit/clips.test.ts test/unit/sources.test.ts test/unit/urls.test.ts`

Expected: all tests PASS.

- [ ] **Step 5: Commit the public data boundary**

```bash
git add src/lib test/unit/clips.test.ts test/unit/sources.test.ts test/unit/urls.test.ts
git commit -m "feat: add public clip projection and aggregations"
```

### Task 3: Reading Layout, Timeline, and Detail Pages

**Files:**
- Create: `src/layouts/SiteLayout.astro`
- Create: `src/components/Nav.astro`
- Create: `src/components/ClipCard.astro`
- Create: `src/components/ThemeToggle.astro`
- Create: `src/pages/index.astro`
- Create: `src/pages/page/[page].astro`
- Create: `src/pages/clips/[...slug].astro`
- Create: `src/styles/global.css`
- Create: `test/e2e/site.spec.ts`
- Create: `playwright.config.ts`

**Interfaces:**
- Consumes: `getPublicClips`, `clipPath`, `excerpt`, `withBase`.
- Produces: shared page shell props `{ title: string; description: string; canonicalPath: string }`.
- Produces: public routes `/`, `/page/N/`, and `/clips/<content-id>/`.

- [ ] **Step 1: Write failing browser tests for core reading flow**

Configure Playwright to run `npm run build && npm run preview -- --host 127.0.0.1` and test:

```ts
test('timeline links to a readable clip detail', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '最近摘抄' })).toBeVisible();
  await page.getByRole('link', { name: '阅读也是一种思考' }).click();
  await expect(page.getByText('真正的阅读')).toBeVisible();
  await expect(page.getByRole('link', { name: '如何阅读一本书' })).toBeVisible();
});

test('theme preference persists', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '切换深色模式' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
```

- [ ] **Step 2: Run browser tests and confirm failure**

Run: `npx playwright install chromium && npm run test:e2e`

Expected: FAIL because the routes and components do not exist.

- [ ] **Step 3: Implement the page shell and visual system**

Create semantic landmarks, skip link, four-item navigation, system-following theme initialization, manual theme persistence, and CSS variables. Use a 42–46rem reading column, visible keyboard focus, `prefers-reduced-motion`, single-column mobile layout, and no external font dependency.

- [ ] **Step 4: Implement timeline pagination and detail routes**

Use Astro `paginate(publicClips, { pageSize: 20 })`. `ClipCard` displays title, excerpt, source, author, date, and tag links. Detail pages render the Markdown body, original URL when present, copy-body and copy-link buttons, and up to five other public clips sharing the same source key.

- [ ] **Step 5: Verify UI and accessibility smoke tests**

Run: `npm run check && npm run test:e2e`

Expected: unit checks and both browser tests PASS at desktop and a configured mobile viewport.

- [ ] **Step 6: Commit the reading experience**

```bash
git add src/layouts src/components src/pages src/styles playwright.config.ts test/e2e/site.spec.ts
git commit -m "feat: add timeline and clip reading pages"
```

### Task 4: Tag and Source Navigation

**Files:**
- Create: `src/lib/tags.ts`
- Create: `src/pages/tags/index.astro`
- Create: `src/pages/tags/[tag].astro`
- Create: `src/pages/sources/index.astro`
- Create: `src/pages/sources/[key].astro`
- Create: `test/unit/tags.test.ts`
- Modify: `test/e2e/site.spec.ts`

**Interfaces:**
- Consumes: `getPublicClips`, `groupBySource`, `sourceKey`, `ClipCard`.
- Produces: `groupByTag(clips): TagGroup[]` with `{ tag, key, count, clips }`.
- Produces: routes `/tags/`, `/tags/<encoded-tag>/`, `/sources/`, `/sources/<encoded-source-key>/`.

- [ ] **Step 1: Write failing tag tests**

```ts
it('deduplicates repeated tags within one clip and sorts groups by label', () => {
  const groups = groupByTag(fixtures);
  expect(groups.map(({ tag, count }) => [tag, count])).toEqual([['学习', 2], ['阅读', 1]]);
});
```

Add browser assertions that the sample tag and source counts link to pages containing the sample clip.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- test/unit/tags.test.ts && npm run test:e2e`

Expected: FAIL because tag helpers and aggregation routes are missing.

- [ ] **Step 3: Implement tag and source pages**

Generate static paths only from public groups. Use stable encoded keys in URLs, human labels in headings, newest-first clips, count labels, and canonical metadata. Never call `getCollection('clips')` directly in a page.

- [ ] **Step 4: Verify aggregations and navigation**

Run: `npm test -- test/unit/tags.test.ts test/unit/sources.test.ts && npm run test:e2e`

Expected: unit and browser aggregation tests PASS.

- [ ] **Step 5: Commit tag and source navigation**

```bash
git add src/lib/tags.ts src/pages/tags src/pages/sources test/unit/tags.test.ts test/e2e/site.spec.ts
git commit -m "feat: add tag and source browsing"
```

### Task 5: Static Full-Text Search

**Files:**
- Create: `src/components/Search.astro`
- Create: `src/pages/search.astro`
- Modify: `src/layouts/SiteLayout.astro`
- Modify: `src/components/ClipCard.astro`
- Modify: `test/e2e/site.spec.ts`

**Interfaces:**
- Consumes: Pagefind browser API generated by `pagefind --site dist`.
- Produces: `/search/` with query parameter `q`; supports optional `tag` filtering.

- [ ] **Step 1: Write a failing production-search test**

```ts
test('search finds Chinese clip content and highlights the query', async ({ page }) => {
  await page.goto('/search/');
  await page.getByRole('searchbox', { name: '搜索摘抄' }).fill('真正的阅读');
  await expect(page.getByRole('link', { name: '阅读也是一种思考' })).toBeVisible();
  await expect(page.locator('mark')).toContainText('真正的阅读');
});
```

Also assert that a no-results state contains a button named `清除搜索`.

- [ ] **Step 2: Run the search test and confirm failure**

Run: `npm run build && npm run test:e2e -- --grep search`

Expected: FAIL because `/search/` does not exist.

- [ ] **Step 3: Implement accessible Pagefind search**

Load `/_pagefind/pagefind.js` through `withBase`, debounce input by 150 ms, mirror the query to `?q=`, render result excerpts with Pagefind-provided marked terms, announce result counts with `aria-live`, and preserve static navigation if JavaScript fails. Add `data-pagefind-body` only around public clip content and `data-pagefind-filter="tag:<value>"` for tags.

- [ ] **Step 4: Verify production search**

Run: `npm run build && npm run test:e2e -- --grep search`

Expected: Chinese query and no-results tests PASS against the generated Pagefind index.

- [ ] **Step 5: Commit search**

```bash
git add src/components/Search.astro src/pages/search.astro src/layouts/SiteLayout.astro src/components/ClipCard.astro test/e2e/site.spec.ts
git commit -m "feat: add static full-text search"
```

### Task 6: RSS, Sitemap, Metadata, and Privacy Audit

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`
- Modify: `src/layouts/SiteLayout.astro`
- Create: `src/pages/rss.xml.ts`
- Create: `scripts/audit-private-output.mjs`
- Create: `test/unit/private-output-audit.test.ts`

**Interfaces:**
- Consumes: `getPublicClips`, `withBase`.
- Produces: `/rss.xml`, `/sitemap-index.xml`, canonical and Open Graph metadata.
- Produces: CLI `node scripts/audit-private-output.mjs <dist-dir> <clips-dir>`; parses private Markdown and exits nonzero on leaked private title or body.

- [ ] **Step 1: Write failing audit tests**

Use temporary directories to prove both branches:

```ts
it('fails when a private title or body appears in output', async () => {
  await writePrivateClip(clips, { title: 'PRIVATE_TITLE_MARKER', body: 'PRIVATE_BODY_MARKER' });
  await writeFile(join(dist, 'index.html'), 'PRIVATE_TITLE_MARKER');
  await expect(runAudit(dist, clips)).rejects.toMatchObject({ code: 1 });
});

it('passes when private content does not appear in output', async () => {
  await writePrivateClip(clips, { title: 'PRIVATE_TITLE_MARKER', body: 'PRIVATE_BODY_MARKER' });
  await writeFile(join(dist, 'index.html'), 'public text');
  await expect(runAudit(dist, clips)).resolves.toMatchObject({ code: 0 });
});
```

- [ ] **Step 2: Run audit tests and confirm failure**

Run: `npm test -- test/unit/private-output-audit.test.ts`

Expected: FAIL because the audit script does not exist.

- [ ] **Step 3: Implement feeds, metadata, and audit CLI**

Add `@astrojs/rss` and `gray-matter`. Generate RSS exclusively from `getPublicClips`; include title, canonical link, date, source/author text, and rendered-safe description. Enable Astro sitemap. Make the audit parse every Markdown file under the clips directory, retain only `private: true` entries, and recursively inspect textual files in `dist`. Compare exact private titles and non-empty normalized bodies plus their SHA-256 fingerprints, redact content from logs, and report only the private file ID and output filename. Ignore shared metadata such as source, author, and tags to avoid false positives.

Add script:

```json
"audit:private": "node scripts/audit-private-output.mjs dist src/content/clips"
```

- [ ] **Step 4: Verify public artifacts**

Run: `npm test -- test/unit/private-output-audit.test.ts && npm run build && npm run audit:private`

Expected: tests PASS; RSS and sitemap exist; audit exits 0 without printing secret values.

- [ ] **Step 5: Commit discovery and privacy safeguards**

```bash
git add package.json package-lock.json astro.config.mjs src/layouts/SiteLayout.astro src/pages/rss.xml.ts scripts/audit-private-output.mjs test/unit/private-output-audit.test.ts
git commit -m "feat: add feeds metadata and privacy audit"
```

### Task 7: Authoring Guide and Double-Repository Deployment

**Files:**
- Create: `src/content/clips/_template.md.example`
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`
- Modify: `test/e2e/site.spec.ts`

**Interfaces:**
- Consumes: `npm run check`, `npm run build`, `npm run audit:private`, `npm run test:e2e`.
- Produces: verified `dist/` pushed to the root of `PAGES_REPOSITORY` using `PAGES_DEPLOY_TOKEN`.

- [ ] **Step 1: Add a subpath regression test**

Run production with `BASE_PATH=/read-clip` and assert:

```ts
test('all internal navigation stays under the configured Pages base', async ({ page }) => {
  await page.goto('/read-clip/');
  await expect(page.getByRole('link', { name: '标签' })).toHaveAttribute('href', '/read-clip/tags/');
  await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute('href', /\/read-clip\//);
});
```

- [ ] **Step 2: Run the subpath test and fix any base-path leaks**

Run: `BASE_PATH=/read-clip npm run build && BASE_PATH=/read-clip npm run test:e2e -- --grep subpath`

Expected before corrections: FAIL for any hard-coded root URL. Replace every internal URL with `withBase`; rerun until PASS.

- [ ] **Step 3: Create the deployment workflow**

Workflow requirements:

```yaml
permissions:
  contents: read
concurrency:
  group: pages-production
  cancel-in-progress: false
```

On pushes to `main` and manual dispatch: checkout without persisted credentials, set up the Node version declared in `package.json` engines, run `npm ci`, Playwright Chromium install, `npm run check`, production build with repository-specific `SITE_URL` and `BASE_PATH`, `npm run audit:private`, and `npm run test:e2e`. Only then push the contents of `dist/` to the default branch of `${{ vars.PAGES_REPOSITORY }}` using `${{ secrets.PAGES_DEPLOY_TOKEN }}`. Do not copy `.git`, source Markdown, caches, or environment files. Configure the target repository's Pages source as its root branch.

- [ ] **Step 4: Document authoring and operations**

README must include: prerequisites, install/dev/build commands, exact frontmatter example, date timezone rule, file naming, public/private warning, Pages repository creation, least-privilege token setup, required `SITE_URL`, `BASE_PATH`, and `PAGES_REPOSITORY` values, failed-build diagnosis, and the statement that changing an existing file path changes its public URL.

- [ ] **Step 5: Run the complete local release gate**

Run: `npm ci && npm run check && npm run build && npm run audit:private && npm run test:e2e`

Expected: all unit tests, Astro checks, production build, privacy audit, and browser tests PASS.

- [ ] **Step 6: Commit deployment and documentation**

```bash
git add .github/workflows/deploy.yml README.md src/content/clips/_template.md.example test/e2e/site.spec.ts
git commit -m "ci: publish verified public site artifacts"
```

### Task 8: Final Acceptance and Release Evidence

**Files:**
- Modify only if verification exposes a defect: files owned by Tasks 1–7.

**Interfaces:**
- Consumes: complete application and deployment workflow.
- Produces: a clean, reproducible release candidate satisfying all spec acceptance scenarios.

- [ ] **Step 1: Add a temporary private fixture locally**

Create an uncommitted clip containing unique title `PRIVATE_ACCEPTANCE_7f41a9` and body `PRIVATE_BODY_13cc52`, with `private: true`.

- [ ] **Step 2: Execute the full release gate with the private fixture present**

Run: `npm ci && npm run check && npm run build && node scripts/audit-private-output.mjs dist src/content/clips && npm run test:e2e`

Expected: every command PASS; recursive `rg` over `dist` finds neither unique private marker.

- [ ] **Step 3: Verify failure behavior deliberately**

Copy a unique private marker into a temporary file under `dist/`, rerun the audit, and confirm exit code 1 with the output filename but without the marker value. Remove only that temporary output file afterward and rebuild `dist`.

- [ ] **Step 4: Review the final diff and repository state**

Run: `git diff --check && git status --short && git log --oneline --decorate -10`

Expected: no whitespace errors; only the intentionally uncommitted acceptance fixture is present. Remove that fixture and confirm `git status --short` is empty.

- [ ] **Step 5: Record completion**

Do not create an empty commit. Report the exact release-gate commands and outputs in the handoff, along with the GitHub variables/secrets the user must configure before the first live deployment.
