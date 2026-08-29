# 阅读摘抄

一个面向阅读的静态摘抄站：正文只保存为纯 Markdown，不写 Frontmatter，也不手工维护标题、日期、ID、标签或来源等元数据。

系统会扫描文件路径和正文，自动生成页面、创建时间流、全文搜索、标签分类、RSS 与站点地图，并通过 GitHub Actions 发布到 GitHub Pages。

站点地址：<https://music586.github.io/read-clip/>

## 最快新增一篇摘抄

在 [`src/content/clips`](src/content/clips) 下任意位置新建 `.md` 或 `.mdx` 文件，然后只写正文：

```text
src/content/clips/
├── 随手记录.md
├── 如何阅读一本书/
│   └── 主动阅读.md
└── inbox/
    └── 网页摘抄.md
```

```markdown
# 主动阅读

真正的阅读，是读者与作者共同参与的一种思考活动。

> 阅读越主动，效果越好。
```

提交并推送到 `main`：

```bash
git add src/content/clips
git commit -m "content: add reading clips"
git push origin main
```

GitHub Actions 会自动校验、构建和发布，无需手工运行元数据脚本。

### 文件与标题规则

- `src/content/clips/` 是唯一固定的正文根目录。
- 根目录以内可以自由创建任意层级的目录，不要求按日期、书名或类型组织。
- 系统优先使用正文中出现的第一个 Markdown 标题作为页面标题。
- 正文没有 Markdown 标题时，使用文件名作为标题。
- 目录仅用于本地整理和记录客观路径，不会被自动推断为作者、书籍或来源。
- 空文件会被视为尚未完成的草稿并暂时忽略，写入正文后自动出现在站点中。
- 内容完全相同的重复文件会导致校验失败。

## 使用 Obsidian QuickAdd 快速摘抄

仓库提供了 [`templates/clip.md`](templates/clip.md) 模板，内容只有：

```text
{{CLIPBOARD}}
```

推荐流程：

1. 将本仓库或 `src/content/clips/` 所在目录作为 Obsidian Vault 打开。
2. 安装并启用 Obsidian 社区插件 **QuickAdd**。
3. 在 QuickAdd 中新建一个 **Template** 类型的 Choice，例如“新增摘抄”。
4. 将模板文件设置为 `templates/clip.md`。
5. 将新文件保存目录设置到 `src/content/clips/` 下你习惯的位置，例如 `src/content/clips/inbox/`。
6. 设置文件名格式；可以使用 QuickAdd 的输入框或日期变量，系统不依赖固定命名格式。
7. 在浏览器或电子书中复制内容，执行“新增摘抄”，剪贴板正文就会写入新文件。

如果 Obsidian Vault 只包含 `src/content/clips/`，请把模板复制到 Vault 内的模板目录，再在 QuickAdd 中选择复制后的模板。模板位置不影响站点构建。

创建后可以继续在 Obsidian 中补充标题、段落、引用、列表、链接和代码块；它们都是普通 Markdown，不需要额外字段。

## 本地管理文章标签

运行开发服务器后打开 <http://localhost:4321/admin/>：

```bash
npm run dev
```

管理页可以按标题、路径或标签搜索文章，并为每篇文章填写一个或多个标签。多个标签使用中文或英文逗号分隔，保存后统一写入 [`src/data/tags.json`](src/data/tags.json)。文章 Markdown 不会被修改。

保存标签后，前台“分类”页面会自动按标签聚合文章；文章列表和详情页中的标签也可以直接进入对应分类。分类内的文章按创建时间从新到旧排列。

保存完成后，将标签文件与正文一起提交：

```bash
git add src/data/tags.json
git commit -m "content: update article tags"
git push origin main
```

写入接口只在本地开发服务器中启用。GitHub Pages 上的 `/admin/` 可以查看标签，但不能修改仓库，因此不需要 GitHub Token，也不会暴露写入权限。

### 标签数据格式

标签以正文相对路径为键，每篇文章对应一个标签数组：

```json
{
  "社科/厉害的人的特征.md": ["个人成长"],
  "Agent/Agent 知识系统.md": ["技术", "Agent"]
}
```

通常应通过管理页维护该文件；如需手工编辑，标签会在保存时去重、去除首尾空格并按名称排序。移动或重命名正文后，需要在标签文件中同步修改对应路径。

## 前台页面

| 路径 | 功能 |
| --- | --- |
| `/` | 简洁的站点说明和按创建时间排列的文章列表 |
| `/clips/{id}/` | 窄版文章正文、创建时间和标签导航 |
| `/tags/` | 标签总览和每个标签的文章数量 |
| `/tags/{key}/` | 某个标签下按创建时间倒序排列的文章 |
| `/search/` | 基于 Pagefind 的浏览器本地全文搜索 |
| `/admin/` | 标签管理；仅本地开发服务器支持保存 |
| `/rss.xml` | 按创建时间输出的 RSS |

文章详情页提供“首页 → 分类”的面包屑导航。面包屑和标签都位于正文语义区域之外，并排除 Pagefind 索引；浏览器阅读模式和稍后读工具会优先提取纯 Markdown 正文，不会把这些界面元素拼进文章内容。

## 自动生成的元数据

系统运行以下命令时会扫描全部正文：

```bash
npm run metadata
```

结果写入 `.read-clip/generated/clips.json`。这是可随时重建的临时产物，已被 Git 忽略，不应手工修改或提交。

每篇正文会自动获得：

| 字段 | 生成方式 | 用途 |
| --- | --- | --- |
| 标题 | 正文第一个 Markdown 标题，或文件名 | 首页、详情页、搜索、RSS |
| ID | 相对路径的 SHA-256 摘要前 16 位 | 稳定生成文章链接 |
| 创建时间 | Git 首次提交时间；未提交时使用文件创建时间 | 首页时间排序、RSS |
| 更新时间 | 文件修改时间 | 页面信息 |
| 正文路径 | 相对 `src/content/clips/` 的路径 | 关联正文与元数据 |
| 目录 | 正文所在的相对目录 | 保留文件组织信息 |
| 内容哈希 | 规范化正文的 SHA-256 | 检测完全重复的内容 |
| 标签 | 从 `src/data/tags.json` 按正文路径读取 | 分类页、文章列表和详情页 |

正文内容发生变化不会改变文章链接；移动或重命名文件会改变相对路径，因此会生成新的 ID 和公开链接。已经对外分享的文章不建议随意移动或重命名。

`npm run dev`、`npm run check` 和 `npm run build` 都会先自动生成元数据。开发服务器运行期间，通过 Obsidian 或其他编辑器新增、移动或重命名正文后，下一次页面请求也会刷新元数据，无需重启服务。

## 本地开发

需要 Node.js 22 或更高版本。

```bash
npm ci
npm run dev
```

常用命令：

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器并监听正文变化 |
| `npm run metadata` | 单独重新生成正文元数据 |
| `npm run check` | 运行 Astro 类型检查和单元测试 |
| `npm run build` | 构建静态站点和 Pagefind 搜索索引 |
| `npm run preview` | 本地预览已构建的 `dist/` |
| `npm run test:e2e` | 运行桌面端与移动端浏览器验收测试 |

站点当前提供：

- 按创建时间从新到旧排列的摘抄列表
- 只保留标题、说明和文章列表的轻量首页
- 使用无衬线字体、跟随系统颜色主题和窄版正文的阅读页面
- 兼容浏览器阅读模式的纯正文语义边界
- 浏览器本地全文搜索
- 独立标签数据与本地标签管理页
- 前台标签分类、标签文章列表和标签快捷入口
- 文章面包屑导航
- 浏览器可自动发现但不占用界面空间的 RSS，以及站点地图
- GitHub Pages 自动部署

来源、作者筛选和私密发布功能未提供，以保持正文纯粹并减少人工维护。标签是唯一独立维护的业务信息，不写入 Markdown。

## 项目结构

```text
src/
├── content/clips/       # 任意目录结构的纯 Markdown 正文
├── data/tags.json       # 独立标签数据
├── pages/               # 首页、文章、分类、搜索和管理页
└── styles/global.css    # 全站阅读与管理界面样式
scripts/
├── generate-metadata.mjs # 自动元数据生成
└── admin-tags-plugin.mjs # 仅开发环境启用的标签写入接口
templates/
└── clip.md              # Obsidian QuickAdd 剪贴板模板
```

## GitHub Pages 部署

本项目使用当前仓库自带的 [`deploy.yml`](.github/workflows/deploy.yml)，不需要个人访问令牌，也不需要单独的发布仓库。

首次使用时，在 GitHub 仓库中完成一次设置：

1. 打开 **Settings → Pages**。
2. 在 **Build and deployment** 中，将 **Source** 设置为 **GitHub Actions**。
3. 确认仓库允许 Actions 运行。

以后每次推送到 `main`，工作流会依次：

1. 安装依赖和 Chromium。
2. 生成元数据并运行类型检查、单元测试。
3. 构建 Astro 页面、Pagefind 搜索索引、RSS 和站点地图。
4. 运行桌面端与移动端浏览器测试。
5. 将 `dist/` 作为 GitHub Pages 产物发布。

如需部署到其他 GitHub 用户名或仓库名，请同步修改：

- `.github/workflows/deploy.yml` 中的 `SITE_URL` 和 `BASE_PATH`
- `astro.config.mjs` 中读取或使用这些地址的配置

## 内容安全

这个仓库和生成的 GitHub Pages 都是公开的。所有放进 `src/content/clips/` 并提交的正文都会进入页面、搜索索引、RSS 或构建产物；请勿提交私人笔记、访问令牌、账号信息或其他敏感内容。
