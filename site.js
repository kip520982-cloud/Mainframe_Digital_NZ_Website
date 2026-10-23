(()=>{'use strict';
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
document.documentElement.classList.add('js');

/* nav */
const nav=$('.nav');const toggle=$('.nav-toggle'),links=$('#nav-links');
toggle.addEventListener('click',()=>{const o=links.classList.toggle('open');toggle.setAttribute('aria-expanded',String(o))});
links.addEventListener('click',e=>{if(e.target.closest('a')){links.classList.remove('open');toggle.setAttribute('aria-expanded','false')}});

/* split headings into words */
$$('.split').forEach(el=>{let i=0;const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(t=>{if(!t)return;if(/^\s+$/.test(t)){f.appendChild(document.createTextNode(t))}else{const s=document.createElement('span');s.className='w';s.style.setProperty('--wi',i++);s.textContent=t;f.appendChild(s)}});c.replaceWith(f)}else if(c.nodeType===1&&!c.classList.contains('w'))walk(c)})};walk(el)});

/* reveals */
const items=$$('.reveal,.split');
if(reduce||!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('in'))}
else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -10% 0px',threshold:.15});items.forEach(el=>io.observe(el))}

/* card spotlight follows pointer */
$$('.svc').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')}));

/* hero dot field (canvas) */
const cv=$('#dots');
if(cv){const ctx=cv.getContext('2d');let w,h,dpr,cols,rows,gap=18,visible=true,t0=performance.now();
const size=()=>{dpr=Math.min(window.devicePixelRatio||1,2);w=cv.clientWidth;h=cv.clientHeight;cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);gap=w<700?14:18;cols=Math.ceil(w/gap)+1;rows=Math.ceil(h/gap)+1};
const draw=t=>{ctx.clearRect(0,0,w,h);const cx=w*(w>980?.72:.5),cy=h*.45;for(let y=0;y<rows;y++){for(let x=0;x<cols;x++){const px=x*gap,py=y*gap,dx=(px-cx)/w,dy=(py-cy)/h,d=Math.sqrt(dx*dx*1.4+dy*dy);
const wave=Math.sin(d*18-t*.0011)*.5+.5;const fall=Math.max(0,1-Math.abs(d-.42)*2.6);const a=(.08+wave*.55)*fall;if(a<.03)continue;
ctx.fillStyle=`rgba(57,232,131,${a.toFixed(3)})`;ctx.beginPath();ctx.arc(px,py,.6+wave*1.1*fall,0,6.283);ctx.fill()}}};
const loop=t=>{if(visible)draw(t-t0);requestAnimationFrame(loop)};
size();window.addEventListener('resize',size);
if(reduce){draw(2000)}else{new IntersectionObserver(e=>{visible=e[0].isIntersecting}).observe(cv);requestAnimationFrame(loop)}}

/* connected-workflow switcher: tabs with arrow keys, gentle auto-advance until the visitor interacts */
const flow=$('.flow');
if(flow){const tabs=$$('.flow-tab',flow);let cur=0,timer=null,auto=!reduce,seen=false;const DUR=7000;
const show=(i,focus)=>{cur=(i+tabs.length)%tabs.length;tabs.forEach((t,k)=>{const on=k===cur;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;t.classList.remove('timing');const p=document.getElementById(t.getAttribute('aria-controls'));p.hidden=!on;p.classList.remove('play');if(on){void p.offsetWidth;p.classList.add('play')}});if(focus)tabs[cur].focus();if(auto&&seen)arm()};
const arm=()=>{clearTimeout(timer);const t=tabs[cur];t.style.setProperty('--dur',DUR+'ms');void t.offsetWidth;t.classList.add('timing');timer=setTimeout(()=>show(cur+1),DUR)};
const stop=()=>{auto=false;clearTimeout(timer);tabs.forEach(t=>t.classList.remove('timing'))};
tabs.forEach((t,i)=>{t.addEventListener('click',()=>{stop();show(i)});t.addEventListener('keydown',e=>{const k={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];if(k){e.preventDefault();stop();show(cur+k,true)}else if(e.key==='Home'){e.preventDefault();stop();show(0,true)}else if(e.key==='End'){e.preventDefault();stop();show(tabs.length-1,true)}})});
flow.addEventListener('pointerenter',()=>{if(auto){clearTimeout(timer);tabs[cur].classList.remove('timing')}});
flow.addEventListener('pointerleave',()=>{if(auto&&seen)arm()});
if('IntersectionObserver' in window){new IntersectionObserver(es=>{const v=es[0].isIntersecting;if(v&&!seen){seen=true;show(0)}else if(v&&auto)arm();else if(!v){clearTimeout(timer);tabs[cur].classList.remove('timing')}},{threshold:.35}).observe(flow)}else{seen=true;show(0)}}

/* portfolio filters (client-side, like an isotope sort row) */
const pfBtns=$$('.pf-filter button'),pfTiles=$$('.pf-tile'),pfCur=$('#pf-current');
pfBtns.forEach(b=>b.addEventListener('click',()=>{const f=b.dataset.filter;pfBtns.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));pfTiles.forEach(t=>{t.hidden=f!=='all'&&t.dataset.cat!==f});if(pfCur)pfCur.textContent=b.textContent}));

/* "View larger" lightbox */
const lbLinks=$$('[data-lightbox]');
if(lbLinks.length&&window.HTMLDialogElement){const d=document.createElement('dialog');d.className='lb';d.setAttribute('aria-label','Larger image');d.innerHTML='<button type="button" aria-label="Close">×</button><img alt=""><p></p>';document.body.appendChild(d);
 const im=$('img',d),cap=$('p',d);$('button',d).addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d)d.close()});
 lbLinks.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();im.src=a.getAttribute('href');im.alt=a.dataset.title||'';cap.textContent=a.dataset.title||'';d.showModal()}))}

/* project videos: loop while on screen; reduced motion gets a paused video with controls */
$$('video[data-autoloop]').forEach(v=>{if(reduce){v.removeAttribute('autoplay');v.pause();v.controls=true;return}
 if('IntersectionObserver' in window)new IntersectionObserver(es=>{if(es[0].isIntersecting){const p=v.play();if(p&&p.catch)p.catch(()=>{})}else v.pause()},{threshold:.2}).observe(v)});

/* nav state on scroll */
let ticking=false;const onScroll=()=>{ticking=false;nav.classList.toggle('scrolled',window.scrollY>10)};
window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();

/* hero: background terminal (types short lines, older ones fade) */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const hero=$('.hero');let heroOn=true;
if(hero&&'IntersectionObserver' in window)new IntersectionObserver(e=>{heroOn=e[0].isIntersecting;document.dispatchEvent(new Event('mf:hero'))}).observe(hero);
const waitVisible=()=>new Promise(r=>{const ok=()=>heroOn&&!document.hidden;if(ok())return r();const f=()=>{if(ok()){document.removeEventListener('mf:hero',f);document.removeEventListener('visibilitychange',f);r()}};document.addEventListener('mf:hero',f);document.addEventListener('visibilitychange',f)});
const ht=$('#ht-lines');
const HT=['> invoice raised for Lux Weddings','> lead qualified → booked','> deploying ios build 1.4.2','[ok] crm synced: 24 contacts','> quote sent to Kauri Builders','> payment reminder booked for day 7','[ok] new enquiry → pipeline','> transcribing call from 021 ··· 0142','> follow-up email drafted','[ok] xero: 3 invoices reconciled','> building android release 2.0.1','> site deployed: yourbusiness.co.nz','[ok] booking confirmed · Tue 10:30','> summarising inbox for Kieran','> assistant answered 12 questions','[ok] docs signed → filed in dropbox'];
if(ht&&!reduce&&getComputedStyle(ht.parentNode.parentNode).display!=='none'){
 const N=Math.max(6,Math.floor(ht.clientHeight/26));const rows=[];for(let k=0;k<N;k++){const d=document.createElement('div');d.className='ht-line';ht.appendChild(d);rows.push(d)}
 const KEEP=Math.min(7,N-2);(async()=>{let r=0,li=0;for(;;){await waitVisible();const row=rows[r%N];row.className='ht-line';row.textContent='';const line=HT[li++%HT.length];if(line.startsWith('[ok]'))row.classList.add('ok');
  const t=document.createElement('span');const c=document.createElement('span');c.className='cursor';row.append(t,c);
  for(const ch of line){t.textContent+=ch;await sleep(28+Math.random()*34)}await sleep(500);c.remove();
  rows[(r+N-KEEP)%N].classList.add('out');r++;await sleep(350)}})()}
else if(ht&&reduce){['> lead qualified → booked','[ok] crm synced: 24 contacts','> invoice raised for Lux Weddings'].forEach(l=>{const d=document.createElement('div');d.className='ht-line'+(l.startsWith('[ok]')?' ok':'');d.textContent=l;ht.appendChild(d)})}

/* hero: rotating window (services, same order as the cards below) */
const hw=$('.hw');
if(hw){const stage=$('.hw-stage',hw),slides=$$('.hw-slide',hw),title=$('.hw-title',hw),lab=$('.hw-label'),dots=$$('.hw-dots button'),num=$('.hw-n'),pauseBtn=$('.hw-pause');
 const fit=()=>stage.style.setProperty('--hs',(stage.clientWidth/460).toFixed(4));fit();
 if('ResizeObserver' in window)new ResizeObserver(fit).observe(stage);else window.addEventListener('resize',fit);
 let cur=0,timer=null,paused=reduce,hover=false;const DUR=4600;
 const runTxt=$('.wire-txt',hw);const RUNS=['Quote sent to Kauri Builders','Invoice INV-0142 raised in Xero','Customer updated in HubSpot','Payment reminder booked for day 7'];let runGen=0,runI=0;
 const typeRun=async()=>{if(!runTxt||reduce)return;const g=++runGen;for(;;){const s=RUNS[runI++%RUNS.length];runTxt.textContent='';for(const ch of s){if(g!==runGen)return;runTxt.textContent+=ch;await sleep(30+Math.random()*30)}await sleep(1300);if(g!==runGen)return}};
 const show=i=>{cur=(i+slides.length)%slides.length;const s=slides[cur];
  slides.forEach((x,k)=>{const on=k===cur;x.classList.toggle('on',on);x.setAttribute('aria-hidden',String(!on))});
  dots.forEach((d,k)=>d.setAttribute('aria-current',String(k===cur)));
  if(num)num.textContent=String(cur+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
  title.textContent=s.dataset.title;
  if(lab){lab.classList.add('swap');setTimeout(()=>{$('b',lab).textContent=s.dataset.label;$('small',lab).textContent=s.dataset.sub;lab.classList.remove('swap')},reduce?0:300)}
  if(s.querySelector('.wire-txt'))typeRun();else runGen++;
  arm()};
 const arm=()=>{clearTimeout(timer);if(paused||hover||!heroOn||document.hidden)return;timer=setTimeout(()=>show(cur+1),DUR)};
 dots.forEach((d,k)=>d.addEventListener('click',()=>show(k)));
 pauseBtn.addEventListener('click',()=>{paused=!paused;pauseBtn.setAttribute('aria-pressed',String(paused));pauseBtn.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');arm()});
 if(reduce){pauseBtn.setAttribute('aria-pressed','true');pauseBtn.setAttribute('aria-label','Play slideshow')}
 hw.addEventListener('pointerenter',()=>{hover=true;clearTimeout(timer)});hw.addEventListener('pointerleave',()=>{hover=false;arm()});
 hw.parentNode.addEventListener('focusin',()=>{hover=true;clearTimeout(timer)});hw.parentNode.addEventListener('focusout',()=>{hover=false;arm()});
 document.addEventListener('mf:hero',arm);document.addEventListener('visibilitychange',arm);
 arm()}
})();

/* lead funnel: 2-step consultation form, ?service= prefill, UTM capture, sticky mobile CTA */
(()=>{'use strict';
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const qs=new URLSearchParams(location.search);
// remember UTMs for the session so they survive moving between pages
const UTM=['utm_source','utm_medium','utm_campaign'];
try{UTM.forEach(k=>{if(qs.get(k))sessionStorage.setItem(k,qs.get(k).slice(0,100))});if(!sessionStorage.getItem('mf_ref')&&document.referrer&&!document.referrer.startsWith(location.origin))sessionStorage.setItem('mf_ref',document.referrer.slice(0,300))}catch(e){}
const ss=k=>{try{return sessionStorage.getItem(k)||''}catch(e){return ''}};
window.mfTracking=()=>({utm_source:ss('utm_source'),utm_medium:ss('utm_medium'),utm_campaign:ss('utm_campaign'),page:location.href.slice(0,300),referrer:ss('mf_ref')});

const form=$('#enquiry');
if(form){
  const steps=$$('.enq-step',form),marks=$$('.enq-steps li',form),status=$('.enq-status',form);
  const SERV=['apps','business','website','automation','ai','unsure'];
  const show=n=>{steps.forEach(s=>s.hidden=s.dataset.step!==String(n));marks.forEach(m=>m.classList.toggle('on',m.dataset.for===String(n)))};
  show(1);
  const setErr=(name,msg)=>{const e=$('#e-'+name,form);if(e)e.textContent=msg||'';
    const fields=name==='interests'?$$('[name=interests]',form):[form.elements[name]];fields.forEach(f=>{if(!f)return;if(msg){f.setAttribute('aria-invalid','true');if(e&&f.type!=='checkbox')f.setAttribute('aria-describedby',e.id)}else f.removeAttribute('aria-invalid')})};
  const val=n=>(form.elements[n]&&form.elements[n].value||'').trim();
  const check1=()=>{const errs={};
    if(!val('first_name'))errs.first_name='Please add your first name.';
    if(!val('business'))errs.business='Please add your business name.';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email')))errs.email='Please add a valid email address.';
    if(val('mobile')&&!/^[+()\d\s-]{6,20}$/.test(val('mobile')))errs.mobile='That mobile number doesn\'t look right.';
    if(!val('industry'))errs.industry='Please choose an industry.';
    ['first_name','business','email','mobile','industry'].forEach(k=>setErr(k,errs[k]));return errs};
  const check2=()=>{const errs={};if(!$$('[name=interests]:checked',form).length)errs.interests='Please choose at least one option.';setErr('interests',errs.interests);return errs};
  const focusFirst=errs=>{const k=Object.keys(errs)[0];if(!k)return;const f=k==='interests'?$('[name=interests]',form):form.elements[k];f&&f.focus()};
  $('[data-next]',form).addEventListener('click',()=>{const e=check1();if(Object.keys(e).length)return focusFirst(e);show(2);$('[name=interests]',form).focus({preventScroll:true});form.scrollIntoView({block:'start',behavior:'smooth'})});
  $('[data-back]',form).addEventListener('click',()=>{show(1);form.elements.first_name.focus()});
  form.addEventListener('change',e=>{if(e.target.name==='interests')setErr('interests','')});
  form.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'&&!$('.enq-step[data-step="1"]',form).hidden){e.preventDefault();$('[data-next]',form).click()}});
  // prefill
  const pre=s=>{if(!SERV.includes(s))return;form.elements.service.value=s;const box=$(`[name=interests][value="${s}"]`,form);if(box)box.checked=true};
  pre(qs.get('service'));
  const t=window.mfTracking();Object.keys(t).forEach(k=>{if(form.elements[k])form.elements[k].value=t[k]});
  if(qs.get('error'))status.textContent='Something in the form needs another look. Please check and send again.';
  // service-card links: prefill without reloading when already on the homepage
  $$('a[data-service]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();pre(a.dataset.service);history.replaceState(null,'','/?service='+a.dataset.service+'#contact');show(1);$('#contact').scrollIntoView({behavior:'smooth'});setTimeout(()=>form.elements.first_name.focus({preventScroll:true}),600)}));
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const e1=check1();if(Object.keys(e1).length){show(1);return focusFirst(e1)}
    const e2=check2();if(Object.keys(e2).length)return focusFirst(e2);
    const fd=new FormData(form),data={};
    for(const [k,v] of fd.entries()){if(k==='interests')(data.interests=data.interests||[]).push(v);else data[k]=v}
    data.page=location.href.slice(0,300);
    form.classList.add('sending');status.textContent='';
    try{
      const r=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const j=await r.json().catch(()=>({}));
      if(r.ok&&j.ok){location.href=j.next||('/thanks?name='+encodeURIComponent(data.first_name));return}
      if(j.errors){Object.entries(j.errors).forEach(([k,m])=>setErr(k,m));const s1=['first_name','business','email','mobile','industry'].some(k=>j.errors[k]);show(s1?1:2);focusFirst(j.errors)}
      status.textContent=j.error||'Please check the highlighted fields.';
    }catch(err){status.textContent='We couldn\'t send that just now. Please try again, or email hello@mainframe.kiwi.'}
    form.classList.remove('sending');
  });
}

// sticky mobile CTA: after the hero, hidden while the form is on screen
const sticky=$('.sticky-cta'),hero=$('.hero'),contact=$('#contact');
if(sticky&&hero&&contact&&'IntersectionObserver' in window){
  let pastHero=false,atContact=false;const upd=()=>{const on=pastHero&&!atContact;sticky.classList.toggle('show',on);document.body.classList.toggle('has-sticky',on||pastHero)};
  new IntersectionObserver(([en])=>{pastHero=!en.isIntersecting&&en.boundingClientRect.top<0;upd()}).observe(hero);
  new IntersectionObserver(([en])=>{atContact=en.isIntersecting;upd()},{rootMargin:'0px 0px -10% 0px'}).observe(contact);
  sticky.addEventListener('click',()=>{const f=$('#enquiry');if(f)setTimeout(()=>f.elements.first_name.focus({preventScroll:true}),700)});
}
})();
