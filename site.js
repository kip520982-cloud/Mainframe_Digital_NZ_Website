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
$$('.svc').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')}));

/* hero dot field (canvas) */
const cv=$('#dots');
if(cv){const ctx=cv.getContext('2d');let w,h,dpr,cols,rows,gap=18,visible=true,t0=performance.now();
const size=()=>{dpr=Math.min(window.devicePixelRatio||1,2);w=cv.clientWidth;h=cv.clientHeight;cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);gap=w<700?14:18;cols=Math.ceil(w/gap)+1;rows=Math.ceil(h/gap)+1};
const draw=t=>{ctx.clearRect(0,0,w,h);const cx=w/2,cy=h*.42;for(let y=0;y<rows;y++){for(let x=0;x<cols;x++){const px=x*gap,py=y*gap,dx=(px-cx)/w,dy=(py-cy)/h,d=Math.sqrt(dx*dx*1.4+dy*dy);
const wave=Math.sin(d*18-t*.0011)*.5+.5;const fall=Math.max(0,1-Math.abs(d-.42)*2.6);const a=(.08+wave*.55)*fall;if(a<.03)continue;
ctx.fillStyle=`rgba(57,232,131,${a.toFixed(3)})`;ctx.beginPath();ctx.arc(px,py,.6+wave*1.1*fall,0,6.283);ctx.fill()}}};
const loop=t=>{if(visible)draw(t-t0);requestAnimationFrame(loop)};
size();window.addEventListener('resize',size);
if(reduce){draw(2000)}else{new IntersectionObserver(e=>{visible=e[0].isIntersecting}).observe(cv);requestAnimationFrame(loop)}}

/* scroll-driven: nav state, floating glyphs parallax, story progress */
const floats=$$('.float');const story=$('.story');const bars=$$('.bar i');const panels=$$('.panel');const scenes=$$('.scene');const nodes=$$('.node');
const isStatic=()=>reduce||window.innerWidth<=980;
let ticking=false;
const onScroll=()=>{ticking=false;const y=window.scrollY,vh=window.innerHeight;nav.classList.toggle('scrolled',y>10);
 if(!reduce)floats.forEach(f=>{const r=f.parentElement.getBoundingClientRect();const p=(r.top+r.height/2-vh/2)/vh;f.style.transform=`translate3d(0,${(p*(+f.dataset.speed||60)).toFixed(1)}px,0) rotate(${(p*(+f.dataset.rot||8)).toFixed(1)}deg)`});
 if(story&&!isStatic()){const r=story.getBoundingClientRect();const total=r.height-vh;const p=Math.min(1,Math.max(0,-r.top/total));const n=panels.length;const idx=Math.min(n-1,Math.floor(p*n));
  bars.forEach((b,i)=>{b.style.width=(Math.min(1,Math.max(0,p*n-i))*100).toFixed(1)+'%'});
  panels.forEach((el,i)=>el.classList.toggle('on',i===idx));scenes.forEach((el,i)=>el.classList.toggle('on',i===idx));
  if(idx===2){const local=p*n-2;nodes.forEach((nd,i)=>nd.classList.toggle('lit',local>i/nodes.length*.9))}}};
window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});window.addEventListener('resize',onScroll);onScroll();
if(isStatic()){panels.forEach(p=>p.classList.add('on'))}
$$('.bar').forEach((b,i)=>b.addEventListener('click',()=>{const r=story.getBoundingClientRect();const total=r.height-window.innerHeight;window.scrollTo({top:window.scrollY+r.top+total*(i+.5)/panels.length,behavior:reduce?'auto':'smooth'})}));

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
