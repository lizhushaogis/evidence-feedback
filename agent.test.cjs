const assert=require('node:assert/strict');const {EvidenceAgent:A}=require('./agent.js');
const make=(id,quote='有效原文')=>({id,quote,source:'p2',score:15,feedback:'改进建议',reason:'对应量规',confidence:86});
function finish(c){while(c.status==='running')A.step(c);return c}
let c=finish(A.create(make('S-017'),'R2'));assert.equal(c.status,'ready');assert.equal(c.valid,true);assert.deepEqual(c.events.map(e=>e.action),['read_rubric','locate_evidence','compare_anchor','draft_judgment','validate_citation','package_evidence']);
c=finish(A.create(make('S-031','数据［扫描模糊］'),'R2'));assert.equal(c.status,'waiting');assert.equal(c.retries,1);assert.equal(c.events.at(-1).action,'request_human');assert.equal(A.step(c),null);assert.throws(()=>A.resume(c,' '));A.resume(c,'教师核对：实验组21人');finish(c);assert.equal(c.status,'ready');assert.equal(c.row.manual,true);assert.equal(c.row.score,'');assert.ok(c.row.bundle.supplement);assert.equal(c.events.filter(e=>e.action==='reread_scan').length,1);
c=finish(A.create(make('S-024'),'R2'));assert.equal(c.row.needsModeration,true);assert.equal(c.row.bundle.risk,'助教口径分歧待教师裁决');
c=finish(A.create(make('CUSTOM-01'),'新量规',true));assert.equal(c.status,'waiting');assert.ok(!c.drafted);
c=A.create(make('X'),'R2');c.round=10;A.step(c);assert.equal(c.status,'waiting');
c=A.create(make('X'),'R2');A.step(c);A.step(c);c.evidence.text='捏造引用';finish(c);assert.equal(c.status,'waiting');assert.equal(c.valid,false);assert.ok(!c.row.bundle);
console.log('PASS: normal, missing/retry/wait/resume, moderation, custom, budget, fabricated citation');
