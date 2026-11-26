import fs from 'node:fs';
const base='http://127.0.0.1:4174';let checkpoint;async function api(route,b={}){const r=await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json','X-Evidence-Client':'workspace-v3'},body:JSON.stringify({checkpoint,...b})});const j=await r.json();if(!r.ok)throw Error(j.error);if(j.checkpoint)checkpoint=j.checkpoint;return j}
let x=await api('create',{question:'两组学生分别采用教学方法A和B，问卷均值为3.8和3.2。能否据此认定A更有效？说明依据并提出改进。',rubric:'20分。17–20分：指出均值不足以支持因果结论，讨论随机分组、混杂或统计检验中的至少两项，并提出可行改进。13–16分：指出不能直接推断因果并讨论至少一项限制，但改进不具体。7–12分：仅描述差异或对局限解释不足。0–6分：以均值直接断定因果且没有有效论证。接受合理等价表述。',criteria:[{id:'R1',description:'论证与证据及改进建议',max:20}],answer:'A组平均分高于B组，说明本样本观察到了组间差异。\n但仅凭均值不能确定教学方法造成差异。两组学生原有水平可能不同，题目没有说明是否随机分组。\n我建议随机分组，并在教学前测试两组基础水平；同时报告样本量、变异和差异的统计检验。'});
console.log(JSON.stringify({created:x.job.id,status:x.job.status}));
let previous=0;
for(let i=0;i<18&&x.job.status==='running';i++){
 x=await api('advance');for(const e of x.job.events.slice(previous))console.log(JSON.stringify({round:e.round,action:e.action,ok:e.observation.ok??true,requestId:e.requestId,...(e.observation.error?{error:e.observation.error}:{}),...(e.observation.errors?{errors:e.observation.errors}:{})}));previous=x.job.events.length;
}
if(x.job.status!=='review')throw Error('未进入可复核状态：'+x.job.status+' / '+(x.job.humanQuestion||''));
const blocked=await fetch(base+'/api/export',{method:'POST',headers:{'Content-Type':'application/json','X-Evidence-Client':'workspace-v3'},body:JSON.stringify({checkpoint})});if(blocked.status!==409)throw Error('未确认导出门禁失败');
const j=x.job;const confirmed=await api('confirm',{verified:true,items:j.assessments.map(a=>({criterion_id:a.criterion_id,points:a.points,feedback:a.reason+'\n下一步：'+a.improvement}))});
const artifact=(await api('export')).evidence;
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/deepseek-live-evidence.json',JSON.stringify(artifact,null,2));
const summary={passed:true,provider:'deepseek',model:artifact.model,taskId:artifact.id,status:confirmed.job.status,total:artifact.final.total,toolSteps:artifact.round,tools:artifact.events.map(e=>e.action),semanticAuditPassed:artifact.audit?.passed,unconfirmedExportBlocked:blocked.status===409,requestIds:artifact.requestIds,fixture:'公开编写的研究方法示例，无真实学生信息',testedAt:new Date().toISOString()};
fs.writeFileSync('artifacts/deepseek-live-summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));
