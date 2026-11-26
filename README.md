# 循证 Evidence Studio

高校形成性作业反馈 Agent 产品设计与交互原型。

- [在线 Demo](https://lizhushaogis.github.io/evidence-feedback/)
- [精简 PRD：五部分交付](docs/PRD.md)
- [半页选题与取舍](docs/rationale.md)
- [三分钟演示脚本](docs/demo-guide.md)

纯静态网站，无构建依赖。直接打开 index.html，或运行 `node server.cjs` 后访问 http://localhost:4173。GitHub Pages 使用 main 分支仓库根目录。

两条路径：正常批次逐份复核导出；扫描模糊阻断后补证或人工接管。支持编辑、草稿恢复、CSV 与审计 JSON。所有内置学生与数据均为虚构；未接模型，置信度为预设演示值。自定义输入转人工处理。录音未上传、未转写，未作为证据。
