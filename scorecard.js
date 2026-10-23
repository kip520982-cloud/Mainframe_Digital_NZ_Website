/* AI Opportunity Scorecard: 7 scored questions (0–3 each, max 21) + 1 goal question. Scored in the browser; nothing is sent unless the visitor asks for the email. */
(()=>{'use strict';
const PDF=(document.currentScript&&document.currentScript.dataset.pdf)||'';
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const form=$('#scorecard');if(!form)return;
const qs=$$('.sc-q',form),N=qs.length,back=$('[data-back]',form),nextB=$('[data-next]',form);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const REC={
  enquiries:{title:'Capture every enquiry in one place',body:'Route calls, emails and web forms into one shared inbox or CRM so nothing slips through the cracks. A simple web form with an instant acknowledgement is a good first step.'},
  speed:{title:'Reply to new enquiries faster',body:'Set up an instant, friendly acknowledgement and a same-day follow-up rule. Speed often decides who wins the job, and it is one of the cheapest things to fix.'},
  admin:{title:'Stop re-typing the same information',body:'Connect the tools you already use (forms, email, calendar, Xero) so details are entered once and flow through. This is usually where automation pays for itself first.'},
  data:{title:'Give customer information a proper home',body:'Move from heads, notebooks and spreadsheets to a CRM shaped around how you work, so anyone on the team can see the history and the next step.'},
  website:{title:'Make your website work as a salesperson',body:'A clear next step on every page, a short enquiry form, and tracking that shows which pages and ads actually bring in enquiries.'},
  ai:{title:'Get your team using AI safely',body:'Pick one or two approved tools, write a one-page guideline on what is and isn\u2019t OK to paste in, and run a hands-on session on real tasks from your business.'},
  selfserve:{title:'Let customers help themselves',body:'Online booking, quotes, payments or a simple client portal take routine calls off your plate and give customers answers at any hour.'},
};
const GOAL_PRI=[['website','enquiries','speed'],['speed','selfserve','data'],['admin','data','ai'],['admin','selfserve','ai']];
const BANDS=[[0,8,'Getting started','There\u2019s plenty of easy ground to gain. A few simple changes to how enquiries and admin are handled will free up real time, before you spend much on AI at all.'],
  [9,15,'Ready for quick wins','The basics are in place. The next step is connecting them: automating the hand-offs and follow-ups that still rely on someone remembering.'],
  [16,21,'Ready to scale','You have strong foundations. The next gains come from custom tools and AI built into your own workflows, so you can grow without adding admin.']];
let cur=0;
const bar=$('.sc-bar i'),count=$('#sc-count'),pct=$('#sc-pct');
const go=(i,focus=true)=>{cur=i;nextB.disabled=!$('input:checked',qs[i]);qs.forEach((q,j)=>q.hidden=j!==i);back.hidden=i===0;count.textContent=`Question ${i+1} of ${N}`;const p=Math.round(i/N*100);pct.textContent=p+'%';bar.style.width=p+'%';
  if(focus){const first=$('input:checked',qs[i])||$('input',qs[i]);first&&first.focus({preventScroll:true})}};
const adv=()=>cur<N-1?go(cur+1):finish();
form.addEventListener('change',e=>{if(e.target.type==='radio')nextB.disabled=false});
// pointer/touch picks advance automatically; keyboard users move with arrows and confirm with Enter or Next
form.addEventListener('click',e=>{if(e.target.type==='radio'&&e.detail>0)setTimeout(adv,reduce?0:220)});
nextB.addEventListener('click',()=>{if($('input:checked',qs[cur]))adv()});
// keyboard users: arrow keys move within the radio group; Enter/Space confirm
form.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.type==='radio'){e.preventDefault();e.target.checked=true;nextB.disabled=false;adv()}});
back.addEventListener('click',()=>go(Math.max(0,cur-1)));
let result=null;
function finish(){
  const ans=qs.map(q=>{const c=$('input:checked',q);return c?+c.value:null});
  if(ans.some(a=>a==null)){go(ans.findIndex(a=>a==null));return}
  const scored=qs.slice(0,7).map((q,i)=>({key:q.dataset.key,v:ans[i]}));
  const total=scored.reduce((a,b)=>a+b.v,0);
  const band=BANDS.find(b=>total>=b[0]&&total<=b[1]);
  const goalIdx=ans[7],pri=GOAL_PRI[goalIdx]||[];
  const rank=k=>{const i=pri.indexOf(k);return i<0?9:i};
  const recs=[...scored].sort((a,b)=>a.v-b.v||rank(a.key)-rank(b.key)).slice(0,3).map(s=>REC[s.key]);
  const goalLabel=$(`input[value="${goalIdx}"]+span`,qs[7]).textContent;
  result={total,band:band[2],goal:goalLabel,recommendations:recs,answers:qs.map((q,i)=>$('legend',q).textContent+' '+$(`input[value="${ans[i]}"]+span`,q).textContent)};
  $('#sc-total').textContent=total;$('#sc-band').textContent=band[2];$('#sc-summary').textContent=band[3];
  $('#sc-dot').style.left=(total/21*100)+'%';
  const ol=$('#sc-recs');ol.textContent='';
  recs.forEach(r=>{const li=document.createElement('li'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=r.title;p.textContent=r.body;li.append(h,p);ol.append(li)});
  bar.style.width='100%';form.hidden=true;const res=$('#sc-result');res.hidden=false;res.focus({preventScroll:true});
  res.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'});
}
$('#sc-retake').addEventListener('click',()=>{form.reset();$('#sc-result').hidden=true;form.hidden=false;go(0);form.scrollIntoView({block:'center'})});
// optional email gate
const gate=$('#sc-gate'),st=$('.enq-status',gate);
const err=(k,m)=>{const e=$('#ge-'+k);if(e)e.textContent=m||'';const f=gate.elements[k];if(f){m?f.setAttribute('aria-invalid','true'):f.removeAttribute('aria-invalid')}};
gate.addEventListener('submit',async e=>{e.preventDefault();if(!result)return;
  const v=k=>gate.elements[k].value.trim(),errs={};
  if(!v('first_name'))errs.first_name='Please add your first name.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email')))errs.email='Please add a valid email address.';
  if(!v('business'))errs.business='Please add your business name.';
  ['first_name','email','business'].forEach(k=>err(k,errs[k]));
  const k0=Object.keys(errs)[0];if(k0)return gate.elements[k0].focus();
  const t=window.mfTracking?window.mfTracking():{page:location.href};
  const body={type:'scorecard',first_name:v('first_name'),email:v('email'),business:v('business'),company_reference:gate.elements.company_reference.value,score:result,...t};
  gate.classList.add('sending');st.textContent='';
  try{const r=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));
    if(r.ok&&j.ok){gate.hidden=true;const d=$('#sc-done');d.hidden=false;d.focus();return}
    if(j.errors)Object.entries(j.errors).forEach(([k,m])=>err(k,m));st.textContent=j.error||'Please check the highlighted fields.';
  }catch(_){st.textContent='We couldn\u2019t send that just now. You can still open the playbook below.';const d=$('#sc-done');d.hidden=false}
  gate.classList.remove('sending');
});
go(0,false);
})();
