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
const items=$$('.reveal,.split,.case');
if(reduce||!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('in'))}
else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -10% 0px',threshold:.15});items.forEach(el=>io.observe(el))}

/* card spotlight follows pointer */
$$('.svc,.ind').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')}));

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

/* our-work laptop showcase: instant tab cut, then the page scrolls inside the screen; pauses off-screen, while a tab has keyboard focus, and for reduced motion */
const sc=$('[data-showcase]');
if(sc){const tabs=$$('.sf-tab',sc),n=tabs.length,panels=tabs.map(t=>document.getElementById(t.getAttribute('aria-controls'))),caps=$$('.sc-cap-text',sc),dots=$$('.sc-dotsnav button',sc),domain=$('.sf-domain',sc),view=$('.sf-view',sc);
let cur=0,anim=null,timer=null,gen=0,started=false,visible=false,hover=false;const HOLD_TOP=900,HOLD_END=1200;
const img=i=>panels[i].querySelector('img');
const running=()=>!reduce&&started&&visible&&!hover&&!document.hidden;
const stopAnim=()=>{clearTimeout(timer);if(anim){anim.cancel();anim=null}};
const next=()=>show(cur+1);
const run=()=>{const tok=++gen,im=img(cur);
 const go=()=>{if(tok!==gen)return;const d=Math.max(0,im.getBoundingClientRect().height-view.clientHeight);
  if(d<4){if(running())timer=setTimeout(next,4000);return}
  const dur=Math.min(7000,Math.max(3800,d/view.clientHeight*2400));
  anim=im.animate([{transform:'translateY(0)'},{transform:`translateY(${-d}px)`}],{duration:dur,delay:HOLD_TOP,easing:'cubic-bezier(.45,0,.35,1)',fill:'forwards'});
  anim.onfinish=()=>{if(tok===gen&&running())timer=setTimeout(next,HOLD_END)};
  if(!running())anim.pause()};
 if(im.complete&&im.naturalHeight)go();else im.addEventListener('load',go,{once:true})};
const show=(i,focus)=>{stopAnim();cur=(i+n)%n;
 tabs.forEach((t,k)=>{const on=k===cur;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;panels[k].hidden=!on;if(caps[k])caps[k].hidden=!on;if(dots[k])dots[k].classList.toggle('on',on)});
 panels[cur].scrollTop=0;domain.textContent=tabs[cur].dataset.domain;if(focus)tabs[cur].focus();if(!reduce)run()};
const sync=()=>{if(!started||reduce)return;if(running()){if(anim&&anim.playState==='paused')anim.play();else if(!anim||anim.playState==='finished'){clearTimeout(timer);timer=setTimeout(next,HOLD_END)}}else{clearTimeout(timer);if(anim&&anim.playState==='running')anim.pause()}};
const loadAll=()=>panels.forEach(p=>{const im=p.querySelector('img');if(im.loading==='lazy')im.loading='eager'});
tabs.forEach((t,i)=>{t.addEventListener('click',()=>show(i));t.addEventListener('keydown',e=>{const k={ArrowRight:1,ArrowLeft:-1}[e.key];if(k){e.preventDefault();show(cur+k,true)}else if(e.key==='Home'){e.preventDefault();show(0,true)}else if(e.key==='End'){e.preventDefault();show(n-1,true)}})});
dots.forEach((d,i)=>d.addEventListener('click',()=>show(i)));
const lap=$('.laptop',sc);
lap.addEventListener('focusin',e=>{if(e.target.matches(':focus-visible')){hover=true;sync()}});lap.addEventListener('focusout',e=>{if(!lap.contains(e.relatedTarget)){hover=false;sync()}});
document.addEventListener('visibilitychange',sync);
let rz;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(started&&!reduce)show(cur)},300)});
if(reduce)sc.classList.add('is-static');
show(0);stopAnim();
if('IntersectionObserver' in window){new IntersectionObserver(es=>{if(es[0].isIntersecting)loadAll()},{rootMargin:'800px 0px'}).observe(sc);
 new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible&&!started){started=true;if(!reduce)show(cur)}else sync()},{threshold:.3}).observe(view)}
else{loadAll();visible=true;started=true;if(!reduce)show(0)}}

/* nav state on scroll */
let ticking=false;const onScroll=()=>{ticking=false;nav.classList.toggle('scrolled',window.scrollY>10)};
window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();

/* terminal */
const screen=$('#screen');if(!screen)return;
const routine=['$ python3 mainframe.py','[ok] core services initialized','> mapping business workflows','[ok] AI assistants connected','> syncing your tools','[ok] automations running','> answering every call','[ok] systems integrated','[ready] mainframe services active','> awaiting next project'];
const signatures=['// engineered by mainframe digital','founder = "kieran stapleton"','built_in: auckland, nz'];
let gen=0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function start(){const t=++gen;screen.replaceChildren();let ri=0,si=0,since=0;while(t===gen){let line,sig=false;if(since>=7){line=signatures[si++%signatures.length];since=0;sig=true}else{line=routine[ri++%routine.length];since++}
const row=document.createElement('div');row.className='line'+(sig?' signature':line.startsWith('[ok]')||line.startsWith('[ready]')?' green':'');screen.appendChild(row);
const text=document.createElement('span');row.appendChild(text);const caret=document.createElement('span');caret.className='cursor';row.appendChild(caret);
for(const ch of line){if(t!==gen)return;text.textContent+=ch;await sleep(19+Math.random()*25)}
await sleep(sig?1100:420);caret.remove();while(screen.children.length>8)screen.firstChild.remove();await sleep(130)}}
if(reduce){screen.textContent='[ready] mainframe services active\n// engineered by mainframe digital'}
else{new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){start();o.disconnect()}}).observe(screen)}
})();
