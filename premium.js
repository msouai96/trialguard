(()=>{
const LINK='https://buy.stripe.com/00wcN763V7s85sL7hn8so00';
const FREE_LIMIT=5, PRICE='€5.99';
const ENTRIES='trialguard_prototype_v2', PREMIUM='trialguard_premium_v1';
const get=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch{return d}};
const set=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const isPremium=()=>get(PREMIUM,'')!=='';
const count=()=>{try{const a=JSON.parse(get(ENTRIES,'[]'));return Array.isArray(a)?a.length:0}catch{return 0}};
let justPaid=false;
try{
 const u=new URL(location.href);
 if(u.searchParams.get('paid')==='1'){
  set(PREMIUM,JSON.stringify({at:Date.now()}));
  justPaid=true;
  u.searchParams.delete('paid');
  history.replaceState(null,'',u.pathname+(u.search||'')+u.hash);
 }
}catch{}
function closeModal(){const m=document.getElementById('premiumModal');if(m)m.remove()}
function showModal(title,html){
 closeModal();
 const m=document.createElement('div');
 m.id='premiumModal';m.className='modal-backdrop';
 m.innerHTML='<div class="modal"><h2>'+title+'</h2>'+html+'<div class="form-actions" style="margin-top:14px" id="pmActions"></div></div>';
 document.body.appendChild(m);
 m.addEventListener('click',e=>{if(e.target===m)closeModal()});
 return m.querySelector('#pmActions');
}
function showUpsell(){
 const a=showModal('Free limit reached','<p>The free version tracks up to <strong>'+FREE_LIMIT+'</strong> subscriptions. Unlock TrialGuard for unlimited entries with a one-time payment of <strong>'+PRICE+'</strong>. No subscription, no auto-renewal.</p><p class="small">Payments are handled by Stripe. After paying you return to TrialGuard and it unlocks on this device.</p>');
 const buy=document.createElement('a');buy.className='btn';buy.href=LINK;buy.textContent='Unlock for '+PRICE;buy.style.textDecoration='none';
 const no=document.createElement('button');no.className='btn secondary';no.textContent='Not now';no.onclick=closeModal;
 a.append(buy,no);
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest&&ev.target.closest('#addBtn');
 if(!b||isPremium()||count()<FREE_LIMIT)return;
 ev.stopImmediatePropagation();ev.preventDefault();showUpsell();
},true);
function panel(){
 const footer=document.querySelector('.footer');if(!footer)return;
 let p=document.getElementById('premiumPanel');
 if(!p){p=document.createElement('section');p.className='panel';p.id='premiumPanel';footer.before(p)}
 if(isPremium()){
  p.innerHTML='<h2>TrialGuard Unlocked ✓</h2><p>Thank you! You have unlimited subscriptions on this device.</p>';
 }else{
  const n=count();
  p.innerHTML='<h2>Free plan</h2><p>You are using <strong>'+Math.min(n,999)+' of '+FREE_LIMIT+'</strong> free entries. Unlock unlimited entries for a one-time '+PRICE+'.</p><div class="form-actions"><a class="btn" href="'+LINK+'" style="text-decoration:none">Unlock for '+PRICE+'</a></div>';
 }
}
function init(){
 panel();
 if(justPaid){justPaid=false;const a=showModal('Payment received ✓','<p>Thank you! TrialGuard is now unlocked on this device with unlimited entries.</p>');const ok=document.createElement('button');ok.className='btn';ok.textContent='Great';ok.onclick=closeModal;a.append(ok)}
}
window.addEventListener('load',init);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)panel()});
setInterval(()=>{if(!document.hidden)panel()},5000);
})();
