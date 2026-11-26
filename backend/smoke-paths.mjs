import fs from 'node:fs';
const endpoint='http://127.0.0.1:4174';let checkpoint;
async function api(name,body={}){const r=await fetch(endpoint+'/api/'+name,{method:'POST',headers:{'Content-Type':'application/json','X-Evidence-Client':'workspace-v3'},body:JSON.stringify({checkpoint,...body})});const x=await r.json();if(!r.ok)throw Error(x.error);if(x.checkpoint)checkpoint=x.checkpoint;return x.job||x}
const base={question:'两组均值3.8和3.2能否证明A教学法效果更好？说明局限并提出改进。',rubric:'指出均值差异不证明因果，说明混杂或随机分组的重要性，给出改进；完整20分，只有结论缺少解释10分，错误推断0分。无法辨识的原文必须请求教师补证，不得按缺证扣分。',criteria:[{id:'R1',description:'因果推断与改进',max:20}]};
let j=await api('create',{...base,answer:'',image:'data:image/png;base64,'+fs.readFileSync('artifacts/ocr-fixture.png').toString('base64')});j=await api('ocr');if(j.status!=='ocr_review'||!j.ocr.text.includes('因果')||!j.ocr.text.includes('随机分组'))throw Error('真实图像识别未取得预期文本');console.log(JSON.stringify({ocr:true,model:j.ocr.model,text:j.ocr.text,requestId:j.ocr.requestId}));j=await api('confirm-ocr',{text:j.ocr.text});if(j.status!=='running')throw Error('识别确认后未进入批改');const ocr={model:j.ocr.model,requestId:j.ocr.requestId,text:j.answer,teacherConfirmed:true};
checkpoint=null;j=await api('create',{...base,answer:'答：因为[无法辨识]，所以[无法辨识]。'});
while(j.status==='running'){j=await api('advance');console.log(JSON.stringify({phase:'missing',round:j.round,last:j.events.at(-1)?.action,status:j.status}))}
if(j.status!=='waiting'||!j.events.some(e=>e.action==='ask_teacher'))throw Error('真实缺证输入未进入人工补证');const question=j.humanQuestion;
j=await api('supplement',{text:'已核对原始答卷，学生原话为：仅凭均值不能推断因果，因为两组可能存在基础水平差异。应随机分组并在课前测量基础水平，以控制混杂因素。'});
while(j.status==='running'){j=await api('advance');console.log(JSON.stringify({phase:'resumed',round:j.round,last:j.events.at(-1)?.action,status:j.status}))}
if(j.status!=='review')throw Error('补证后未形成可复核草稿：'+j.status);
const summary={passed:true,ocr,missingEvidence:{askedTeacher:question,resumed:true,score:j.assessments.map(x=>x.points),auditPassed:j.audit?.passed,requestIds:j.requestIds,tools:j.events.map(e=>e.action)},fixture:'自制文本图片与虚构缺证答案，无真实学生信息',testedAt:new Date().toISOString()};fs.writeFileSync('artifacts/deepseek-paths-evidence.json',JSON.stringify({summary,job:j},null,2));console.log(JSON.stringify(summary));
