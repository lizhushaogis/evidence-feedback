# 循证 Evidence Studio · v2

大班课主观题的可举证批改：分数→量规→原文→教师裁决。

- [在线Demo](https://lizhushaogis.github.io/evidence-feedback/)
- [精简PRD](docs/PRD.md)
- [ReAct与Skills设计](docs/agent-design.md)
- [半页选题理由](docs/rationale.md)
- [三分钟演示](docs/demo-guide.md)

无依赖HTML/CSS/JS，GitHub Pages main根目录部署。本地运行node server.cjs，访问http://127.0.0.1:4173。文档修改后运行node build-docs.cjs。运行node agent.test.cjs验证状态分支。

v2新增状态驱动的ReAct循环：感知→决策摘要→Skill工具调用→观察→再决策。缺证分支会重读、失败暂停、补证恢复。另含助教评分分歧、逐分依据、人工裁决与审计JSON。技能规程见skills/目录。

诚实边界：这是ReAct机制的交互模拟原型，决策与语义评分是预设策略；工具调度、引用校验、暂停恢复与门禁真实执行。未使用Dify、未连接LLM/OCR；自定义内容转人工。所有答卷、分差、置信度为虚构演示，用户场景数字为待验证假设。录音未转写或公开。
