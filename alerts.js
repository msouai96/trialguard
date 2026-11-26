(()=>{
const ENTRIES='trialguard_prototype_v2',TOPIC='trialguard_ntfy_topic',DONE='trialguard_ntfy_scheduled_v1';
const get=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch{return d}};
const set=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const del=k=>{try{localStorage.removeItem(k)}catch{}};
const newTopic=()=>{const a=new Uint8Array(12);crypto.getRandomValues(a);return 'trialguard-'+Array.from(a,b=>b.toString(16).padStart(2,'0')).join('')};
async function publish(topic,title,message,whenMs){
 const body={topic,title,message,tags:['bell']};
 if(whenMs)body.delay=String(Math.floor(whenMs/1000));
 const r=await fetch('https://ntfy.sh/',{method:'POST',body:JSON.stringify(body)});
 return r.ok;
}
function text(e,d){
 const plural=d===1?'':'s';
 if(e.type==='trial')return d===0?'Your free trial for '+e.name+' ends today. Decide now, or cancel with the provider.':'Your free trial for '+e.name+' ends in '+d+' day'+plural+'.';
 const amt=Number(e.amount).toFixed(2)+' '+e.currency;
 return d===0?e.name+': a payment of '+amt+' is due today.':e.name+': a payment of '+amt+' is due in '+d+' day'+plural+'.';
}
async function schedule(){
 const topic=get(TOPIC,'');if(!topic)return 0;
 let entries=[],done={};
 try{entries=JSON.parse(get(ENTRIES,'[]'))}catch{}
 try{done=JSON.parse(get(DONE,'{}'))}catch{}
 const now=Date.now(),limit=now+71*3600e3;
 for(const e of entries){
  if(!e||e.cancelled||typeof e.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date))continue;
  const [y,m,dd]=e.date.split('-').map(Number);
  for(const d of [7,3,1,0]){
   const t=new Date(y,m-1,dd-d,9,0,0).getTime();
   if(t<=now+60000||t>limit)continue;
   const k=e.id+'|'+e.date+'|'+d;
   if(done[k])continue;
   try{if(await publish(topic,'TrialGuard',text(e,d),t))done[k]=t}catch{}
  }
 }
 for(const k of Object.keys(done))if(done[k]<now)delete done[k];
 set(DONE,JSON.stringify(done));
 return Object.keys(done).length;
}
function build(){
 const footer=document.querySelector('.footer');if(!footer||document.getElementById('alertsPanel'))return;
 const p=document.createElement('section');p.className='panel';p.id='alertsPanel';
 footer.before(p);
 render();
}
async function render(){
 const p=document.getElementById('alertsPanel');if(!p)return;
 const topic=get(TOPIC,'');
 if(!topic){
  p.innerHTML='<h2>Alerts when the app is closed</h2><p>Get a phone notification at 9:00 on reminder days even if TrialGuard is closed. This uses the free ntfy app.</p><div class="form-actions"><button class="btn" id="alOn">Turn on phone alerts</button></div>';
  document.getElementById('alOn').onclick=()=>{set(TOPIC,newTopic());render();schedule().then(render)};
  return;
 }
 const n=Object.keys(JSON.parse(get(DONE,'{}')||'{}')).length;
 p.innerHTML='<h2>Alerts when the app is closed</h2><p>Alerts are ON. Queued alerts: <strong>'+n+'</strong>.</p>'
 +'<div class="notice"><strong>One-time setup</strong><br>1. Install the free <strong>ntfy</strong> app from Google Play.<br>2. In ntfy tap <strong>+</strong> and subscribe to this topic (keep it private, it works like a password):<br><input id="alTopic" readonly style="width:100%;margin-top:8px;padding:10px;border:1px solid #dce8df;border-radius:10px" value="'+topic+'"></div>'
 +'<div class="form-actions" style="margin-top:10px"><button class="btn light" id="alCopy">Copy topic</button><button class="btn secondary" id="alTest">Send test alert</button><button class="btn danger" id="alOff">Turn off</button></div>'
 +'<div class="notice warn" style="margin-top:10px">Limits: the ntfy service can schedule only 3 days ahead, so open TrialGuard at least every 3 days. If you cancel or delete an entry, alerts already queued still arrive. Alerts contain service names and are sent through ntfy.sh.</div><p class="small" id="alMsg"></p>';
 const msg=t=>{document.getElementById('alMsg').textContent=t};
 document.getElementById('alCopy').onclick=async()=>{try{await navigator.clipboard.writeText(topic);msg('Topic copied.')}catch{document.getElementById('alTopic').select();msg('Select and copy the topic above.')}};
 document.getElementById('alTest').onclick=async()=>{try{msg((await publish(topic,'TrialGuard test','Phone alerts are working.'))?'Test sent. It should arrive in the ntfy app within seconds.':'Could not send the test.')}catch{msg('Could not reach ntfy. Check your connection.')}};
 document.getElementById('alOff').onclick=()=>{if(confirm('Turn off phone alerts? Already queued alerts can be stopped by unsubscribing in the ntfy app.')){del(TOPIC);del(DONE);render()}};
}
function run(){build();schedule().then(()=>{if(!document.hidden)render()})}
window.addEventListener('load',run);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)run()});
setInterval(()=>{if(!document.hidden)schedule()},300000);
})();
