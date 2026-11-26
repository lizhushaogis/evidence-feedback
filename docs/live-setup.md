# 真实 DeepSeek Agent：运行与验证

## 当前实现

真实后端在 backend/core.mjs、backend/api.mjs，界面为 live.html / live.js。每轮向 DeepSeek Responses API 请求工具决策；后端执行白名单工具、返回观察，再让模型决定下一步。批改结果来自输入的题目、量规与答案，不复用模拟页面的固定评分。

默认地址 https://api.deepseek.com，默认批改模型 deepseek-flash，可切换 deepseek-v4-pro。图片识别固定使用 deepseek-flash；识别文本经教师核对后再批改。这里使用视觉模型逐字转录，不宣称调用了专用OCR接口。资料见 [DeepSeek Responses](https://api-docs.deepseek.com/guides/responses_api/) 与 [图像支持](https://api-docs.deepseek.com/guides/vision/)。

## 本机运行

安装Node.js 22或更新版本，双击仓库根目录 Start-Live-Agent.cmd，或运行：

    node --env-file-if-exists=.env.local live-server.mjs

打开 http://127.0.0.1:4174/?setup 。默认地址与模型已填好；只在密码框输入DeepSeek密钥，点击“保存并验证真实连接”。不要把密钥发到聊天或提交GitHub。

配置仅存后端进程内存，页面不回显也不写入浏览器持久存储。关闭后端会清除密钥。部署管理员也可以通过服务端环境变量配置 DEEPSEEK_API_KEY、DEEPSEEK_BASE_URL、DEEPSEEK_MODEL，禁止放进前端脚本。

## 真实验收

1. 保存并验证连接，确认返回真实模型名与request ID；401说明密钥错误，402说明账户余额不足，429为速率限制。
2. 回到批改页，填写真实题目、量规、评分维度与已脱敏答案，确认标准后创建。
3. 逐轮或连续执行，查看模型真实选取 read_skill、read_material、find_evidence、record_assessment、verify_judgment、finish，或 ask_teacher。
4. 缺证会暂停，教师补证后旧评分与语义核验失效，模型需要重新读取答案。最多16次工具执行，模型可能在一次请求中返回多个工具，后端逐个验证并配对结果。
5. 评分必须覆盖全部维度，分数不能超满分，引用必须逐字存在于对应段落；再发起独立语义核验请求。核验失败不能finish。模型复核不是独立教师双评。
6. 教师修改并确认最终结果后，后端才允许导出证据JSON；重新打开后旧确认撤销。无自动登分或学生消息发送。
7. 图片作业使用PNG/JPEG/WebP≤4MB；模型识别后必须人工核对。TXT≤100KB。PDF/DOCX尚无解析支持。

## 状态与隐私

本机服务只绑定127.0.0.1。任务以AES-GCM加密检查点保存在当前浏览器，24小时有效；本机加密密钥位于被Git忽略的 .data/。关闭服务后密钥不丢，但删除.data会使旧任务无法解密。密钥配置不在检查点中。证据包包含学生原文，导出后由教师妥善保管。

GitHub Pages只能展示静态界面，不能运行后端。真实使用须运行本机服务，或另部署私有后端并配置服务端Secret。没有密钥时应明确报错，不能回退为模拟结果。

测试：node --test backend/live.test.mjs。协议、分支、校验与安全测试使用假的网络响应，不消耗API额度，也不作为真实模型验收证据。真实调用是否完成，应以实际request ID与对应任务结果为准。
