/* A bounded ReAct simulator. The decision policy and grading are mock adapters;
   tool dispatch, observations, branching, validation and checkpoints execute locally. */
(function(root){
const skills={
 'evidence-grading':{name:'循证评分',description:'读取量规 → 定位原文 → 形成逐项评分依据。缺证时禁止给出确定结论。',tools:['read_rubric','locate_evidence','draft_judgment']},
 'moderation':{name:'口径校准',description:'对照教师确认的锚定样卷，识别助教分歧；分歧交负责人裁决。',tools:['compare_anchor']},
 'evidence-repair':{name:'证据修复',description:'关键段落不清时尝试一次重读；仍失败则暂停并请求教师补证。',tools:['reread_scan','request_human']},
 'audit-check':{name:'证据链校验',description:'检查逐字引用、分数范围与量规版本，生成可追溯证据包。',tools:['validate_citation','package_evidence']}
};
const tools={
 read_rubric(c){c.rubricLoaded=true;return {version:'v1',criterion:'R2',text:c.rubric}},
 locate_evidence(c){c.evidence={text:c.row.quote,source:c.row.source};c.missing=c.row.quote.includes('［扫描模糊］')&&!c.supplement;return {found:!c.missing,text:c.evidence.text,source:c.evidence.source,supplement:c.supplement||null}},
 reread_scan(c){c.retries++;return {ok:false,reason:'模拟扫描重读后关键字段仍无法辨识',attempt:c.retries,maxAttempts:1}},
 request_human(c){c.status='waiting';return {status:'waiting_for_teacher',reason:c.forceManual?'自定义内容或标准无模型适配，需人工评价':'关键证据缺失，不得按缺证扣分',choices:['教师补证后继续校验','人工接管']}},
 compare_anchor(c){c.anchorChecked=true;const conflict=c.row.id==='S-024';c.dispute=conflict;return {anchor_id:'A-R2-01',version:'v1',status:conflict?'moderation_required':'aligned',...(conflict?{ta_scores:[11,17],difference:6,reason:'对“识别限制但未提出改进”的分档理解不同，需负责人统一口径；均为演示值'}:{reason:'与已确认锚定样卷一致（模拟比对）'})}},
 draft_judgment(c){c.drafted=true;return {mode:'mock_judgment',score:c.row.score,criterion:'R2',reason:c.row.reason,requires_teacher:true}},
 validate_citation(c){c.checked=true;const found=c.evidence&&c.row.quote.includes(c.evidence.text);c.valid=Boolean(found&&(c.manualResolved||(!c.missing&&Number.isInteger(Number(c.row.score))&&c.row.score!==''&&+c.row.score>=0&&+c.row.score<=20)));return {citation_exists:Boolean(found),rubric_version:'v1',score_valid:c.manualResolved?'等待教师评分':c.valid,status:c.valid?'passed':'blocked'}},
 package_evidence(c){c.status='ready';c.row.needsModeration=!!c.dispute;c.row.bundle={criterion:'R2',rubricVersion:'v1',original:{text:c.evidence.text,source:c.evidence.source},supplement:c.supplement||null,anchor:'A-R2-01',suggestedScore:c.row.score,reason:c.row.reason,risk:c.dispute?'助教口径分歧待教师裁决':c.manualResolved?'补证已核验，待人工评分':'待教师确认',citationVerified:c.valid};return {status:'draft_ready',evidence_id:c.row.id+'-R2-v1',teacher_confirmation_required:true}}
};
function create(row,rubric,forceManual=false){return {row,rubric,forceManual,status:'running',round:0,retries:0,events:[],missing:false}}
function decide(c){
 if(!c.rubricLoaded)return ['evidence-grading','read_rubric','先读取教师确认的标准，避免凭通用知识评分'];
 if(!c.evidence)return ['evidence-grading','locate_evidence','需定位与本题评分点对应的原文'];
 if(c.forceManual&&!c.manualResolved)return ['evidence-repair','request_human','当前没有适配的模型判断，交给教师'];
 if(c.missing&&!c.manualResolved){if(c.retries<1)return ['evidence-repair','reread_scan','观察到关键字段不可辨识，先尝试一次证据修复'];return ['evidence-repair','request_human','重读失败，停止自行推断并请求补证'];}
 if(!c.anchorChecked)return ['moderation','compare_anchor','已有证据，检查评分口径是否与锚定样卷一致'];
 if(!c.drafted&&!c.manualResolved)return ['evidence-grading','draft_judgment',c.dispute?'发现助教分歧，生成待裁决草稿并保留双方分数':'证据与标准已齐，形成待教师核对的评分草稿'];
 if(!c.checked)return ['audit-check','validate_citation','交付前验证引用存在且建议未越界'];
 if(!c.valid)return ['evidence-repair','request_human','校验失败，不能交付无依据评分'];
 return ['audit-check','package_evidence','校验通过，整理证据包；最终交付仍需教师确认'];
}
function step(c){if(c.status!=='running')return null;if(c.round>=10){c.status='waiting';return {round:c.round,decision:'达到十轮预算，转人工',action:'budget_stop',observation:{status:'waiting'},perception:'未满足交付条件'}}const [skill,action,decision]=decide(c);if(!skills[skill].tools.includes(action))throw Error('Tool not allowed');const perception={submission:c.row.id,evidence:c.evidence?'已定位':'待定位',missing:c.missing,retries:c.retries,lastObservation:c.events.at(-1)?.observation||null};const event={round:++c.round,skill,perception,decision,action,input:{submission:c.row.id,rubric:'v1',...(action==='reread_scan'?{attempt:c.retries+1}:{})},observation:tools[action](c)};c.events.push(event);return event}
function resume(c,text){if(c.status!=='waiting'||!text.trim())throw Error('需要等待状态和有效补证');c.supplement=text.trim();c.manualResolved=true;c.forceManual=false;c.missing=false;c.status='running';c.checked=false;c.valid=false;c.evidence={text:c.row.quote,source:c.row.source};c.row.manual=true;c.row.score='';c.row.feedback='';c.row.reason='教师补证已记录；本原型不对新证据进行语义评分，需教师独立完成评分。';c.events.push({round:c.round,action:'teacher_supplement',observation:{text:c.supplement},decision:'教师提供新观察，恢复循环',perception:{status:'waiting'}})}
root.EvidenceAgent={skills,tools,create,decide,step,resume};
})(typeof module==='object'?module.exports:window);
