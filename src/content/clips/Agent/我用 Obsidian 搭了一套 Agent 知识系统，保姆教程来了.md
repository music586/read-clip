# 我用 Obsidian 搭了一套 Agent 知识系统，保姆教程来了！

> 作者：关于作者DatawhaleDatawhale开源组织，公众号:Datawhale​桔了个仔、平凡也关注了他回答22文章656关注者13,277已关注​发私信
>
> 原文：[知乎专栏](https://zhuanlan.zhihu.com/p/2076831780347428993)

---

[Datawhale](https://zhida.zhihu.com/search?content_id=282423769&content_type=Article&match_order=1&q=Datawhale&zhida_source=entity)干货

很多人开始使用知识库时，最先解决的是把资料和想法记录下来。但内容积累到一定程度后，会发现同一主题的知识分散在不同时间、不同项目和不同页面中，新旧结论可能彼此冲突，过时内容仍然会被搜索到。这时再交给 Agent 检索，它也可能根据旧内容给出已经不适用的答案。

我在本地 [Obsidian](https://zhida.zhihu.com/search?content_id=282423769&content_type=Article&match_order=1&q=Obsidian&zhida_source=entity) 中保存项目背景、设计决策、领域资料和故障经验。日常主要通过两个 Agent 工作流维护它：一个负责整理新增和修改的笔记，补充导航和关联；另一个围绕研发、排障和选型等真实问题进行深度调研，把分散资料提炼成结构化报告，再沉淀回知识库。后来团队成员也需要共同使用这些内容，我就把资料包压缩后发给别人，但压缩包只是某个时间点的快照，后续新增、修改和经验沉淀仍然需要同步。因此，我把本地 [Vault](https://zhida.zhihu.com/search?content_id=282423769&content_type=Article&match_order=1&q=Vault&zhida_source=entity) 迁移到 [Kubernetes](https://zhida.zhihu.com/search?content_id=282423769&content_type=Article&match_order=1&q=Kubernetes&zhida_source=entity) 上运行的远程 Obsidian，并通过 [MCP](https://zhida.zhihu.com/search?content_id=282423769&content_type=Article&match_order=1&q=MCP&zhida_source=entity) 让不同成员的 Agent 访问同一个远程 Vault。

## 一、笔记多了，难题从记录变成维护

一开始，解决一个问题，查几篇文档、记下一条结论就够了。笔记多起来以后，同一个主题可能分散在多个项目、多个时间点和多个页面里。旧结论没有及时标记，重复内容没有合并，后来再搜索时，很容易把历史记录和当前做法混在一起。

这时，知识库需要的已经不只是存储，而是关系和维护：哪篇笔记是来源，哪篇是当前结论，哪些内容彼此相关，哪些链接已经失效。Agent 如果只做关键词搜索，也可能把过时内容当成答案。

所以问题从“写好一篇笔记”变成了“让一组笔记能够被找到、被关联、被更新和被再次使用”。

![](https://pic2.zhimg.com/v2-b0862ac598837f28e84886f81a0cb5cf_1440w.jpg)

同一主题的内容先分散在不同卡片里，再通过双链和定期整理形成知识关系。

Obsidian 把内容保存在 Vault 中，笔记、附件、Canvas 和 Bases 都保留各自的文件格式；同时，它通过双链、标签、搜索和索引，把这些内容组织成一个工作区。

这让内容本身容易迁移，也让“关系”成为知识的一部分。笔记正文之外，Agent 还需要看到属性、出链、反向链接和未解析链接，并能沿着笔记中的引用路径找到附件，才能理解一篇笔记处在什么上下文中。

本地使用时，Obsidian 保持运行并打开目标 Vault，Agent 通过obsidian-cli调用它完成读写。这样，Obsidian 可以继续维护笔记的链接、属性和索引。

![](https://picx.zhimg.com/v2-24f5c1c6e1de82519b5a3cb1183fa403_1440w.jpg)

Vault 保存内容，Obsidian 负责组织内容之间的关系

![](https://pic4.zhimg.com/v2-1d6085143f31a4a5921305aed4e9f7c5_1440w.jpg)

本地 Agent 通过 CLI 调用正在运行的 Obsidian 实例

## 三、Agent：一边使用，一边维护知识

Agent 的作用不只是回答问题，还包括维护知识库。一个简单的工作闭环是：先把素材记录下来，再回顾已有笔记，确认哪些内容属于同一主题，补上双链，最后维护主题 Index。

人负责提供背景、判断重要关系和确认最终结论；Agent 负责降低记录、检索和整理的成本。内容越多，越需要固定规则告诉 Agent 从哪里开始查、什么内容优先、不同目录分别保存什么。

因此，目录约定、检索顺序和写入边界可以放进共同的AGENTS.md和TOOLS.md。例如先查可复用的领域知识，再查主题 Index，最后回到项目原始资料；如果知识库和代码对同一个事实说法不一致，以代码和线上实现为准。

![](https://pica.zhimg.com/v2-358d75e49af8b2ae1adcb508e6db5696_1440w.jpg)

Agent 不只记录卡片，还要把相关内容连接起来

## 四、为什么复制 Vault 解决不了团队共享

当团队成员也需要使用这些内容时，最直接的做法是把本地 Vault 复制给他们。复制一次可以完成迁移或分发，但不能解决持续共享问题：压缩包只是某个时间点的快照，后续新增、修改和经验沉淀仍然需要同步；如果每个人都维护自己的副本，就很难保证团队使用的是同一份当前知识，新的内容也没有一个共同位置可以写回。

这次的做法是先复制一次，完成从本地 Vault 到远程 Vault 的迁移；迁移完成后，远程 Vault 成为团队共同使用的版本，本地 Vault 不再承担日常同步职责。成员各自使用自己的 Agent，这些 Agent 都通过 MCP 访问同一个远程 Vault。

![](https://pic4.zhimg.com/v2-96e8a3629af18245d2c504d5c5bad53b_1440w.jpg)

成员使用各自的 Agent，通过 MCP 访问同一份远程 Vault

## 五、把 Obsidian 部署成远程工作区

Obsidian 不是一个只提供接口的后台服务，它还包含图形界面、文件监听、索引、插件、窗口状态和当前打开的 Vault。容器里需要保留完整的 Obsidian 工作区，让它持续运行，并被团队共同访问。

这次以 [LinuxServer](https://zhida.zhihu.com/search?content_id=282423769&content_type=Article&match_order=1&q=LinuxServer&zhida_source=entity) 的 Obsidian 镜像为基础。由于基础镜像中的中文显示存在乱码问题，我们先将镜像拉取到本机，再补充 CJK 字体和 locale，构建适配 Kubernetesamd64节点的最终镜像。

Kubernetes 配置为单副本 StatefulSet，并挂载 Config PVC 和 Vault PVC。Config PVC 保存插件、桌面配置和运行状态；Vault PVC 保存笔记与附件。

![](https://pic2.zhimg.com/v2-9436aafba54caa88124713d1d49f6d2d_1440w.jpg)

远程 Obsidian 工作区由镜像、Pod、PVC 和浏览器入口共同组成

部署完成后，团队成员通过浏览器进入远程桌面中的 Obsidian：

![](https://pic3.zhimg.com/v2-001ca74c4c2fee4ce6031027bf81c5ec_1440w.jpg)

团队成员首次进入远程 Obsidian 工作区

![](https://pic4.zhimg.com/v2-d5e331a9092849747676ea5bcb77c14f_1440w.jpg)

节点直连、云负载均衡和网关，分别适用于不同的访问需求

已有本地 Vault 先打包上传，再通过远程工作区中的文件管理入口解压到持久化存储中，最后由 Obsidian 打开这个目录。

![](https://pic1.zhimg.com/v2-58a5f7462d25e628f19b1d3b9b0d1ea4_1440w.jpg)

本地 Vault 已迁移到远程工作区

到这里，本地知识库已经变成了一个可持续运行、团队共同访问的远程 Obsidian 工作区。

六、用 MCP 接通 Agent 与共享 Vault

团队成员现在可以通过8300使用远程 Obsidian，但 Agent 还需要一条专门的调用通道。Agent 这一侧是 MCP Client，负责发起连接和调用工具；远程 Obsidian 插件提供 MCP Server，负责接收请求，并通过正在运行的 Obsidian 访问当前打开的 Vault。

![](https://pic2.zhimg.com/v2-87f7bef546f375c8f0751ab399512c5b_1440w.jpg)

Agent 侧的 MCP Client 与远程 Obsidian 插件提供的 MCP Server 双向通信，Server 再访问当前打开的 Vault。

```
http://<节点IP>:8301/mcp/
```

8301是本次部署配置的端口，并不是 MCP 或 Obsidian 固定规定的端口。团队成员使用 Obsidian 的浏览器入口则是另一条独立的8300访问路径。

接通后，Agent 可以通过 MCP 读取和修改远程 Vault。读取结果不只是 Markdown 正文，还包括links、backlinks、tags、frontmatter和unresolvedLinks；笔记中的附件则继续通过正文里的引用路径关联。这样它检索的是带关系的知识，而不是一组孤立的文本。

当多个 Agent 都能修改同一篇远程笔记时，并发覆盖问题就出现了。比如，Agent A 和 Agent B 同时读取了一篇笔记，拿到的是同一份内容。A 先完成修改并保存；如果 B 继续基于旧内容提交，A 的修改就可能被覆盖。

这个问题可以直接使用 MCP 提供的文件版本校验能力处理。Agent 读取文件时会得到一个version版本标记，提交修改时在vault\_patch中带上ifMatch=version。文件从读取到提交之间没有变化，写入就会成功；如果另一个 Agent 已经修改过文件，版本不一致，服务端返回412，当前 Agent 重新读取最新内容后再提交。ifMatch不是独立的 MCP 工具，而是写入请求中的版本校验条件。

这是一种整文件粒度的乐观并发控制。它允许多个 Agent 同时读取，但提交时检查整份文件是否仍然是刚才读到的版本；即使两个 Agent 修改的是不同段落，后提交者持旧版本提交时仍会被拒绝。实际使用时，只需要把“先读取版本、提交时携带ifMatch、冲突后重新读取”写进 skill 或 Agent 的写入规则中。实测中，多个请求持有同一版本并发提交时，只有一个成功，其余请求被拒绝。

![](https://pica.zhimg.com/v2-4433b8b0a45334073bd56469ae0263a4_1440w.jpg)

多个 Agent 修改同一文件时，提交请求通过version和ifMatch判断是否允许写入。

七、这套知识系统是否有用，怎么判断

远程工作区和 MCP 接通后，下一步要验证的是：这套知识有没有真正进入团队工作。可以从一次真实任务开始观察：成员能否找到可靠依据并完成工作，新的经验能否沉淀下来，供下一次继续使用。

围绕这条闭环，可以建设三个衡量指标。

![](https://pic3.zhimg.com/v2-fa813d2780b758fb2ec7f7d384994742_1440w.jpg)

从检索质量与效率、知识复用率、沉淀闭环完成率三个观察点，判断系统是否真正进入团队工作。

-   Agent 查得准不准、快不快
    

这就是检索质量与效率。可以从 Agent 的 Trace 中查看：它调用了哪些工具、返回了哪些笔记、有没有找到与问题相关且当前有效的知识，以及从提出问题到定位原始记录花了多长时间。

Trace 能记录 Agent 找了什么、怎么找的，但不能单独证明结果一定正确。是否命中准确知识，还需要通过人工复核或一组已经知道答案的问题进行判断。持续记录命中、误命中、漏命中和定位耗时，就能看到检索能力是否稳定。

-   查到的知识有没有真正用上
    

这就是知识复用率。它不再看 Agent 有没有返回某篇笔记，而是看这份知识有没有进入后续的判断、方案、开发或排障结果。

可以从任务记录中查看：最终方案是否引用了已有笔记，过去的设计决策是否影响了当前判断，故障处理是否复用了历史经验。内容相似不等于真正复用，最好能留下来源、链接或实际影响工作结果的证据。

-   新经验有没有留下并再次使用
    

这就是沉淀闭环完成率。一次任务结束后，如果产生了可复用的新决策、方案、故障结论或验证结果，就把它写入ai/drafts临时草稿目录，经过人工审核后进入正式知识，并在后续相关任务中再次使用。

持续观察写回、审核、正式发布和后续复用这些记录，就能判断新经验有没有真正完成沉淀闭环。这里的后续复用需要在提前设定的观察周期内发生。

当团队持续使用系统时，这三类记录会逐渐积累：Trace 说明 Agent 查得准不准、快不快，任务结果说明知识有没有真正用上，知识记录说明新经验有没有继续回流，共同构成上线后的闭环验证。
