---
name: audit-check
description: 循证产品技能规程，供原型调度器参考
---

# audit-check

证据链校验：工具validate_citation检查逐字引用存在、分数范围与标准版本，再package_evidence整理证据包。引用存在不代表语义支持评分；不得越过教师确认发布成绩。每份最多十轮，超限转人工。

权限：只读当前题目、量规与锚卷，输出建议与风险；无教务写入或消息发送权限。工具白名单在agent.js注册；本文件不是已安装进生产模型的技能。
