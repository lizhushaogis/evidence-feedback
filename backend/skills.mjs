export const runtimeSkills={
 'evidence-grading':{name:'循证评分',instructions:'先读取题目、教师量规和答案；若有锚卷则读取。依据教师确认的criterion_id逐项评价，引用必须逐字存在于P编号对应的学生答案。合理异解须认可，缺证不得认定答错。record_assessment提交完整维度、分数、依据、改进与未校准把握等级。无权发布成绩。',tools:['read_material','find_evidence','record_assessment']},
 'moderation':{name:'口径校准',instructions:'只使用教师实际提供的锚卷与裁决，不编造助教分差。锚卷与量规冲突或合理异解未覆盖时，ask_teacher暂停由负责人裁决，不静默平均。',tools:['read_material','ask_teacher']},
 'evidence-repair':{name:'缺证补证',instructions:'关键文本不清、标准冲突或无法可靠判断时，ask_teacher明确询问所需原文。教师补证后旧评分失效，必须重新读取答案，不推断模糊文字。',tools:['read_material','find_evidence','ask_teacher']},
 'audit-check':{name:'交付核验',instructions:'record_assessment通过后，verify_judgment独立调用模型检查引用语义支持和量规一致。失败须修订或请求教师，不能finish。通过也仅生成待教师复核草稿，不宣称评分准确率。',tools:['verify_judgment','finish','ask_teacher']}
};
