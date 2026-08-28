# 阅读摘抄

一个以纯 Markdown 为内容源的静态阅读摘抄站。正文不使用 Frontmatter；系统根据文件路径与文件信息自动生成标题、时间、ID、目录信息和内容哈希。

## 新增摘抄

在 `src/content/clips/` 内任意位置创建 `.md` 或 `.mdx` 文件。目录层级和文件名没有固定格式，例如：

```text
src/content/clips/随手记录.md
src/content/clips/如何阅读一本书/主动阅读.md
src/content/clips/inbox/网页摘抄.md
```

文件中只写正文：

```markdown
真正的阅读，是读者与作者共同参与的一种思考活动。
```

也可以使用一级标题；系统会优先把第一个 Markdown 标题作为站点标题，否则使用文件名。目录只作为客观文件信息记录，不会被猜测成书籍或文章来源。

QuickAdd 模板位于 `templates/clip.md`，模板只写入剪贴板正文。

## 自动元数据

运行：

```bash
npm run metadata
```

系统扫描所有正文并生成 `.read-clip/generated/clips.json`。该目录是可重建产物，已被 Git 忽略，不需要人工编辑或提交。生成字段包括：

- 基于相对路径的 16 位稳定 ID
- 相对正文路径
- Git 首次提交时间；未提交文件使用文件创建时间
- 文件修改时间
- Markdown 标题或文件名生成的标题
- 正文 SHA-256 哈希
- 正文相对目录

ID 由相对路径确定，因此正文内容修改不会改变链接；移动或重命名文件会产生新的公开链接。

`npm run dev`、`npm run check` 和 `npm run build` 都会自动生成元数据。开发服务器运行期间，通过 Obsidian 或其他编辑器新增、移动或重命名正文时，下一次页面请求也会自动刷新索引，无需重启服务。完全相同的正文或空正文会阻止构建。

## 本地运行

需要 Node.js 22 或更高版本：

```bash
npm ci
npm run dev
npm run check
npm run build
npm run test:e2e
```

站点保留时间流、摘抄详情、全文搜索、RSS、复制操作和深浅主题。标签、来源书架、作者筛选及私密发布已移除，以避免需要人工维护元数据。当前仓库公开，请勿提交敏感内容。

## GitHub Pages

仓库 Settings → Pages → Build and deployment 的 Source 必须设为 `GitHub Actions`。推送到 `main` 后，工作流会检查内容、运行测试、构建 Pagefind 搜索索引并发布 `dist/`。

站点地址：`https://music586.github.io/read-clip/`。
