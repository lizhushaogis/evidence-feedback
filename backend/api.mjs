import {AppError,createJob,advance,recognize,confirmOCR,supplement,takeover,confirm,view,normalizeBase,modelRequest} from './core.mjs';
const enc=new TextEncoder(),dec=new TextDecoder();
function b64(b){let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(s)}
function un64(s){try{return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}catch{throw new AppError('任务凭证格式不正确')}}
async function key(env){if(!env.CHECKPOINT_SECRET)throw new AppError('服务端未配置任务加密密钥',503);return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',enc.encode(env.CHECKPOINT_SECRET)),'AES-GCM',false,['encrypt','decrypt'])}
export async function seal(j,env){const iv=crypto.getRandomValues(new Uint8Array(12));const data=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(env),enc.encode(JSON.stringify(j))));const joined=new Uint8Array(iv.length+data.length);joined.set(iv);joined.set(data,iv.length);return b64(joined)}
export async function open(token,env){if(typeof token!=='string'||token.length>18000000)throw new AppError('任务凭证缺失或过大');let j;try{const b=un64(token);j=JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:b.subarray(0,12)},await key(env),b.subarray(12))))}catch{throw new AppError('任务凭证无效或已失效，请重新导入')};if(j.expires<Date.now())throw new AppError('任务已超过24小时，请导出或重新导入',410);return j}
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function handleApi(req,env,fetcher=fetch){
 const url=new URL(req.url);if(!url.pathname.startsWith('/api/'))return null;
 try{
  if(req.method==='GET'&&url.pathname==='/api/status')return json({mode:'live',provider:'deepseek',configured:!!env.DEEPSEEK_API_KEY,model:env.DEEPSEEK_MODEL||'deepseek-flash',baseUrl:env.DEEPSEEK_BASE_URL||'https://api.deepseek.com',ocrModel:env.DEEPSEEK_OCR_MODEL||'deepseek-flash',checkpointConfigured:!!env.CHECKPOINT_SECRET,local:env.LOCAL_MODE==='true',notice:'真实DeepSeek请求；不会降级为模拟结果'});
  if(req.method!=='POST')throw new AppError('仅支持POST',405);
  if(req.headers.get('X-Evidence-Client')!=='workspace-v3'||!req.headers.get('Content-Type')?.startsWith('application/json'))throw new AppError('不接受跨站或非JSON请求',403);
  const origin=req.headers.get('Origin');if(origin&&origin!==url.origin)throw new AppError('来源不匹配',403);
  const raw=await req.text();if(raw.length>20000000)throw new AppError('请求过大，请减少图片大小',413);let b;try{b=JSON.parse(raw)}catch{throw new AppError('JSON格式不正确')}
  if(url.pathname==='/api/local-config'){
   if(env.LOCAL_MODE!=='true')throw new AppError('云端凭据须由部署管理员配置',403);
   if(b.key&&!/^\S{15,500}$/.test(b.key))throw new AppError('密钥格式不正确');
   const base=b.baseUrl?normalizeBase(b.baseUrl):env.DEEPSEEK_BASE_URL;
   if(b.model&&!/^[\w.:-]{1,100}$/.test(b.model))throw new AppError('模型名格式不正确');
   if(b.key)env.DEEPSEEK_API_KEY=b.key;if(base)env.DEEPSEEK_BASE_URL=base;if(b.model)env.DEEPSEEK_MODEL=b.model;
   return json({ok:true,configured:!!env.DEEPSEEK_API_KEY,notice:'仅保存在当前服务进程内存，未写入文件'});
  }
  if(url.pathname==='/api/test-connection'){const r=await modelRequest(env,{input:'Reply with exactly OK.',max_output_tokens:64},fetcher);return json({ok:true,model:r.model,requestId:r._requestId})}
  const owner=req.headers.get('oai-authenticated-user-id')||(env.LOCAL_MODE==='true'?'local':'private-service');
  let j;if(url.pathname==='/api/create'){j=createJob(b);j.owner=owner}else{j=await open(b.checkpoint,env);if(j.owner!==owner)throw new AppError('任务不属于当前用户',403)}
  if(url.pathname==='/api/advance')await advance(j,env,fetcher);
  else if(url.pathname==='/api/ocr')await recognize(j,env,fetcher);
  else if(url.pathname==='/api/confirm-ocr')confirmOCR(j,b.text);
  else if(url.pathname==='/api/supplement')supplement(j,b.text);
  else if(url.pathname==='/api/takeover')takeover(j);
  else if(url.pathname==='/api/confirm'){if(b.verified!==true)throw new AppError('请先勾选核对确认');confirm(j,b.items)}
  else if(url.pathname==='/api/reopen'){if(j.status!=='confirmed')throw new AppError('没有可重新打开的结果');j.history.push({type:'reopen',previous:j.final,at:new Date().toISOString()});j.final=null;j.status='manual'}
  else if(url.pathname==='/api/export'){if(j.status!=='confirmed')throw new AppError('尚未获得教师确认，不能导出',409);return json({evidence:view(j)})}
  else if(!['/api/create','/api/restore'].includes(url.pathname))throw new AppError('接口不存在',404);
  return json({job:view(j),checkpoint:await seal(j,env)});
 }catch(e){return json({error:e instanceof AppError?e.message:'请求处理失败；请保留草稿并重试。'},e instanceof AppError?e.status:500)}
}
