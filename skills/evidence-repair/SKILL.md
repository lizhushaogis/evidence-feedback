---
name: evidence-repair
description: 循证产品技能规程，供原型调度器参考
---

# evidence-repair

证据修复：缺证后先用reread_scan重读一次，仍失败则request_human暂停。教师补证形成新观察后恢复；新证据无模型评分时仍由教师判断。不得把缺证当答错，禁止无限重试。

权限：只读当前题目、量规与锚卷，输出建议与风险；无教务写入或消息发送权限。工具白名单在agent.js注册；本文件不是已安装进生产模型的技能。
