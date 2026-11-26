# 循证 Evidence Studio · DeepSeek 真实后端 + v2交互原型

真实版：双击 `Start-Live-Agent.cmd`，打开 http://127.0.0.1:4174/?setup ，在本机密码框配置DeepSeek密钥。支持真实模型工具决策、可调用Skills、语义评分核验、Flash图像转录及教师确认。详见[真实版运行与验收](docs/live-setup.md)。GitHub Pages不能运行服务端；在线原型与本机真实版明确分开。

后端测试：`node --test backend/live.test.mjs`，10项通过。另已完成DeepSeek真实文本评分、图像转录、缺证补证恢复和浏览器教师改判验收，见[实际调用记录与质量问题](docs/live-validation.md)。密钥和`.data/`任务加密密钥均不进入GitHub。真实调用可用不代表模型评分可靠，已观察到的越量规扣分案例也如实记录。

大班课主观题的可举证批改：分数→量规→原文→教师裁决。

- [在线Demo](https://lizhushaogis.github.io/evidence-feedback/)
- [精简PRD](docs/PRD.md)
- [ReAct与Skills设计](docs/agent-design.md)
- [半页选题理由](docs/rationale.md)
- [三分钟演示](docs/demo-guide.md)

无依赖HTML/CSS/JS，GitHub Pages main根目录部署。本地运行node server.cjs，访问http://127.0.0.1:4173。文档修改后运行node build-docs.cjs。运行node agent.test.cjs验证状态分支。

v2新增状态驱动的ReAct循环：感知→决策摘要→Skill工具调用→观察→再决策。缺证分支会重读、失败暂停、补证恢复。另含助教评分分歧、逐分依据、人工裁决与审计JSON。技能规程见skills/目录。

v2静态原型边界：在线GitHub Pages的决策与语义评分仍为预设策略；未接模型，自定义内容转人工。真实模型版使用独立本机4174后端与live.html入口，调用DeepSeek；两者均未使用Dify。所有演示答卷、分差和置信度是虚构数据，场景数字为待验证假设。录音未转写或公开。
