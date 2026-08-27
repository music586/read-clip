# 阅读摘抄

一个以 Markdown 为内容源的静态阅读摘抄站。Astro 负责内容校验与页面生成，Pagefind 在构建后创建浏览器本地全文索引；公开页面不需要数据库或常驻服务器。

## 本地使用

需要 Node.js 22 或更高版本。

```bash
npm ci
npm run dev
npm run check
npm run build
npm run audit:private
npm run test:e2e
```

`npm run build` 会依次执行 Astro 类型与内容检查、生成静态页面，并在 `dist/_pagefind/` 创建搜索索引。

## 新增摘抄

复制 `src/content/clips/_template.md.example`，并按日期放入 `src/content/clips/YYYY/MM/`。推荐文件名为 `YYYY-MM-DD-short-title.md`。一个文件只保存一条摘抄，Markdown 正文不能为空。

```markdown
---
title: "阅读也是一种思考"
source: "如何阅读一本书"
author: "莫提默·J·艾德勒"
url: "https://example.com/book"
tags:
  - 阅读
  - 学习方法
createdAt: "2026-08-28T20:30:00+08:00"
private: false
---

真正的阅读，是读者与作者共同参与的一种思考活动。
```

`title`、`source`、`createdAt` 和正文必填。`createdAt` 必须是带明确时区的 ISO 日期时间，例如 `2026-08-28T20:30:00+08:00` 或 `2026-08-28T12:30:00Z`；仅写日期或省略时区会使构建失败。`author`、`url`、`tags` 可省略，`private` 默认是 `false`。

摘抄的公开 URL 来自文件相对于 `src/content/clips/` 的路径。移动或重命名已发布文件会改变公开 URL；需要调整时应另行维护重定向。

## 私密内容边界

`private: true` 会在页面、标签、来源、RSS、站点地图和 Pagefind 索引生成前排除该摘抄，构建后还会扫描公开产物。但本仓库是公开仓库，任何人仍能直接查看其中的 Markdown 源文件。因此 `private: true` 仅表示“不展示在站点中”，不能用于保存敏感或真正私密的内容。

## GitHub Pages 部署

本项目直接从当前公开仓库发布，不需要 Personal Access Token、Actions secrets 或额外的发布仓库。

1. 进入仓库 Settings → Pages。
2. 在 Build and deployment 中将 Source 设为 `GitHub Actions`。
3. 推送到 `main`，或手动运行 “Verify and publish public site” 工作流。

工作流只有在内容校验、单元测试、生产构建、隐私审计和浏览器测试全部通过后，才会上传 `dist/` 并部署。GitHub 自动提供短期 `GITHUB_TOKEN`，站点地址为 `https://music586.github.io/read-clip/`。

## 排查失败

- 内容错误：运行 `npm run check`，终端会指出无效文件与字段；重点检查必填字段、URL、日期时区和空正文。
- 路径冲突：两个 Markdown/MDX 文件映射到同一 URL 时会列出两者 ID，重命名其中一个。
- 隐私审计失败：日志只显示私密内容文件 ID 和泄漏产物文件名，不显示私密文本。检查是否绕过了 `getPublicClips()`。
- 搜索测试失败：先确认 `npm run build` 已生成 `dist/_pagefind/`，再运行端到端测试。
- 子路径资源 404：当前发布路径固定为 `/read-clip`；仓库重命名后需要同步修改工作流中的 `BASE_PATH`。
- 部署失败：确认 Settings → Pages → Source 已设为 `GitHub Actions`，并检查工作流的 `pages: write` 与 `id-token: write` 权限。
