/* GSAP motion layer for mainframe.kiwi — loads after site.js (which splits
   headings into .w words). If the CDN or prefers-reduced-motion says no,
   this file no-ops and the CSS/IntersectionObserver reveals stand alone. */
(() => {
'use strict';
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce || !window.gsap || !window.ScrollTrigger) return;
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

document.documentElement.classList.add('gsap-on');
gsap.registerPlugin(ScrollTrigger);

/* hero entrance — one timeline, staggered word rise */
const hero = $('.hero');
if (hero) {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  const nav    = $$('.nav');
  const term   = $$('.hero-term');
  const words  = $$('.hero .split .w');
  const lede   = $$('.hero .lede');
  const ctas   = $$('.hero .cta-row > *');
  const visual = $$('.hero-visual');
  if (nav.length)    tl.from(nav,    { y: -18, autoAlpha: 0, duration: .55, clearProps: 'all' }, 0);
  if (term.length)   tl.from(term,   { autoAlpha: 0, duration: 1 }, .15);
  if (words.length)  tl.from(words,  { y: '.7em', autoAlpha: 0, duration: .8, stagger: .045 }, .1);
  if (lede.length)   tl.from(lede,   { y: 20, autoAlpha: 0, duration: .7 }, '-=.4');
  if (ctas.length)   tl.from(ctas,   { y: 14, autoAlpha: 0, duration: .55, stagger: .09 }, '-=.45');
  if (visual.length) tl.from(visual, { y: 34, autoAlpha: 0, scale: .965, duration: 1, clearProps: 'scale' }, '-=.75');

  /* terminal backdrop drifts as the hero scrolls away */
  const termEl = $('.hero-term');
  if (termEl) gsap.to(termEl, {
    yPercent: 22, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .5 }
  });
}

/* scroll reveals — batched, fire once, stagger per batch */
const rev = $$('.reveal').filter(el => !el.closest('.hero'));
if (rev.length) {
  ScrollTrigger.batch(rev, {
    start: 'top 88%',
    once: true,
    onEnter: els => gsap.from(els, { y: 26, autoAlpha: 0, duration: .8, ease: 'power3.out', stagger: .09, overwrite: true })
  });
}

/* split-word headings below the hero rise word by word */
$$('.split').filter(el => !el.closest('.hero')).forEach(el => {
  const w = $$('.w', el);
  if (!w.length) return;
  gsap.from(w, {
    y: '.6em', autoAlpha: 0, duration: .7, ease: 'power4.out', stagger: .04, overwrite: true,
    scrollTrigger: { trigger: el, start: 'top 85%', once: true }
  });
});

/* keep triggers honest once fonts/images settle layout */
window.addEventListener('load', () => ScrollTrigger.refresh());
})();
