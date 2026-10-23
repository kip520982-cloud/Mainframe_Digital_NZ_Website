(()=>{'use strict';
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');
// sticky nav state
const nav=document.querySelector('.nav');
const onScroll=()=>nav.classList.toggle('scrolled',window.scrollY>8);
onScroll();window.addEventListener('scroll',onScroll,{passive:true});
// mobile menu
const toggle=document.querySelector('.nav-toggle'),links=document.getElementById('nav-links');
toggle.addEventListener('click',()=>{const o=links.classList.toggle('open');toggle.setAttribute('aria-expanded',String(o))});
links.addEventListener('click',e=>{if(e.target.closest('a')){links.classList.remove('open');toggle.setAttribute('aria-expanded','false')}});
// scroll reveals
const items=document.querySelectorAll('.reveal');
if(reduce||!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('in'))}
else{const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.12});items.forEach(el=>io.observe(el))}
// terminal
const screen=document.getElementById('screen');if(!screen)return;
const routine=['$ python3 mainframe.py','[ok] core services initialized','> mapping business workflows','[ok] AI assistants connected','> syncing your tools','[ok] automations running','> answering every call','[ok] systems integrated','[ready] mainframe services active','> awaiting next project'];
const signatures=['// engineered by mainframe digital','founder = "kieran stapleton"','built_in: auckland, nz'];
let gen=0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function start(){const t=++gen;screen.replaceChildren();let ri=0,si=0,since=0;while(t===gen){let line,sig=false;if(since>=7){line=signatures[si++%signatures.length];since=0;sig=true}else{line=routine[ri++%routine.length];since++}
const row=document.createElement('div');row.className='line'+(sig?' signature':line.startsWith('[ok]')||line.startsWith('[ready]')?' green':'');screen.appendChild(row);
const text=document.createElement('span');row.appendChild(text);const caret=document.createElement('span');caret.className='cursor';row.appendChild(caret);
for(const ch of line){if(t!==gen)return;text.textContent+=ch;await sleep(19+Math.random()*25)}
await sleep(sig?1100:420);caret.remove();while(screen.children.length>9)screen.firstChild.remove();await sleep(130)}}
if(reduce){screen.textContent='[ready] mainframe services active\n// engineered by mainframe digital'}else start();
const r=document.getElementById('restart');if(r)r.addEventListener('click',()=>{if(!reduce)start()});
})();
