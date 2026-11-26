# ReAct循环与Skills机制

## 目标与执行合同

目标是为每个建议分数找到可追溯依据，缺证时停下。每轮读取目标、原文、量规、上一工具观察、补证状态与预算，由决策器选择技能和工具；调度器做白名单校验后执行，返回结构化观察并更新状态。不是固定步骤成功动画。

正常：read_rubric→locate_evidence→compare_anchor→draft_judgment→validate_citation→package_evidence→教师确认。

缺证：locate_evidence返回found=false→下一轮改用reread_scan→失败→request_human暂停。教师补证成为新observation→恢复循环→compare_anchor→validate_citation→package_evidence。补证不证明答案正确；Demo无语义模型，补证后的评分仍由教师完成。

分歧：compare_anchor返回演示助教11/17分→保留分歧，不平均；draft_judgment给15分待核草稿→证据包标记争议→负责人依据量规裁决。锚卷比对是预设样例，未接真实检索模型。

停止条件：证据包就绪、等待人工、教师中止或每份十轮预算。扫描修复最多一次，失败不无限重读。生产技术失败可重试两次，仍失败交人工。工具循环完成不等于成绩发布。

## Skill注册表

| Skill | 触发 | 工具 | 结束或升级 |
| --- | --- | --- | --- |
| evidence-grading 循证评分 | 未读取标准、未取证、未形成草稿 | read_rubric、locate_evidence、draft_judgment | 有草稿；缺证转修复 |
| moderation 口径校准 | 已取证需对照锚卷 | compare_anchor | 已比对；分歧交负责人 |
| evidence-repair 证据修复 | 缺证、校验失败、自定义无模型适配 | reread_scan、request_human | 修复后恢复；失败等人工 |
| audit-check 证据链校验 | 证据与草稿待检查 | validate_citation、package_evidence | 包就绪；失败转人工 |

规程位于skills/各技能/SKILL.md；注册表、决策与本地工具在agent.js；循环UI在agent-ui.js；教师复核与交付在app.js。Skill是任务规程、工具集合与权限组合，不代表已安装进某模型平台。

## 生产模型接口（设计，尚未接入）

每轮模型只返回skill_id、tool_name、arguments、decision_summary；服务端验证枚举、参数schema、课程权限、量规版本、预算与幂等键后执行。工具返回ok、data、source_refs、risk_flags、retryable、error_code。不得让模型指定任意URL、路径或发布目标。界面展示短行动理由与工具结果，不展示模型私有思维链。

上下文含task_id、question_id、rubric_version、anchor_version、observations、remaining_budget、human_checkpoint。模型不能修改权限或跳过教师确认。人工节点持久化可恢复状态，恢复前校验标准版本。生产可用Dify或自建调度器承载，但均需实现这些约束；当前没有使用Dify。

## 真实与模拟边界

真实执行：JS技能注册和分派、状态驱动分支、每轮本地调用与返回值、扫描一次预算、十轮预算、人工等待与补证恢复、逐字引用存在检查、分数范围检查、确认门禁、轨迹导出。

模拟：决策策略替代LLM，语义评分、锚卷比对和扫描重读失败为预设样例；置信度为演示值。自定义TXT走人工。引用存在不代表语义支持评分，教师须核验，后续另做语义评测。

未实现：真实模型、OCR、向量检索、锚卷库、LMS、服务端持久化与角色权限、防篡改审计、学生申诉工单。不能直接用于真实成绩。

机制依据：[ReAct原论文](https://arxiv.org/abs/2210.03629)。
