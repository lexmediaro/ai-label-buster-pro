/* AI Label Buster Pro — ailabelbuster.com effects. The same effects library as metacleanai.com (fx.js + main.js),
   trimmed to what this page uses. Every effect pauses off screen and shows its finished state under prefers-reduced-motion. */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const onView = (el, enter, leave, opts = {}) =>
  new IntersectionObserver(([e]) => (e.isIntersecting ? enter() : leave && leave()), { threshold: opts.threshold ?? 0.2, rootMargin: opts.margin ?? '0px' }).observe(el);

/* ---- Sparkle burst: stars pop in around an element, drift and fade ----
   [data-sparkle] runs while visible; or call sparkle(el).start() / .stop(). data-sparkle="ring" frames the element. */
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5c.6 5.2 2.3 8.5 10.5 10.5-8.2 2-9.9 5.3-10.5 10.5C11.4 17.3 9.7 14 1.5 12c8.2-2 9.9-5.3 10.5-10.5Z"/></svg>';
function sparkle(el, { every = [220, 420], max = 6 } = {}) {
  if (el.sparkle) return el.sparkle;
  let t = 0, on = false, live = 0;
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const spawn = () => {
    if (!on) return;
    if (live < max) {
      const s = document.createElement('i');
      s.className = 'fx-star'; s.innerHTML = STAR;
      let x, y;
      if (el.dataset.sparkle === 'ring') { const a = rand(0, Math.PI * 2), r = rand(52, 64); x = 50 + Math.cos(a) * r; y = 50 + Math.sin(a) * r; }
      else { x = rand(-6, 106); y = rand(-8, 108); }
      s.style.left = x + '%'; s.style.top = y + '%';
      const sc = rand(.55, 1.15), dx = rand(-40, 40), dy = rand(-40, 40), r = rand(-25, 25);
      el.append(s); live++;
      s.animate([
        { opacity: 0, transform: 'translate(-50%,-50%) scale(0)' },
        { opacity: 1, transform: `translate(-50%,-50%) scale(${sc})`, offset: .28 },
        { opacity: 0, transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${r}deg) scale(${sc * .8})` },
      ], { duration: 1250, easing: 'cubic-bezier(.2,.8,.3,1)' }).finished.then(() => { s.remove(); live--; });
    }
    t = setTimeout(spawn, rand(...every));
  };
  const api = { start() { if (reduced || on) return; on = true; spawn(); }, stop() { on = false; clearTimeout(t); } };
  el.sparkle = api;
  return api;
}

/* ---- Headings: split into words so they can rise one by one (keeps <br> and the marker underline) ---- */
document.querySelectorAll('[data-words]').forEach(h => {
  let i = 0;
  [...h.childNodes].forEach(n => {
    if (n.nodeType === 1 && n.tagName !== 'BR') {
      const parts = n.textContent.split(/[ \t\n\r]+/).filter(Boolean);
      if (parts.length < 2 || n.classList.contains('nw') || n.classList.contains('mark')) { n.classList.add('w'); n.style.setProperty('--i', i++); return; }
      // several words (e.g. the gradient kicker): keep ONE span so the gradient flows across it; it fades in at its turn
      n.classList.add('w-soft'); n.style.setProperty('--i', i); i += parts.length; return;
    }
    if (n.nodeType !== 3) return;
    const frag = document.createDocumentFragment();
    n.textContent.split(/([ \t\n\r]+)/).forEach(part => {          // not \s: a no-break space keeps two words together
      if (!part) return;
      if (/^[ \t\n\r]+$/.test(part)) { frag.append(' '); return; }
      const w = document.createElement('span');
      w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = part;
      frag.append(w);
    });
    n.replaceWith(frag);
  });
});

/* ---- Reveal on scroll ---- */
const reveal = el => { el.classList.add('in'); io.unobserve(el); };
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) reveal(e.target); }), { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('[data-rise], [data-words]').forEach(el => io.observe(el));

/* ---- Platform cards: dealt in one by one, then each platform's own label is struck out ---- */
document.querySelectorAll('[data-platforms]').forEach(list => {
  const cards = [...list.children];
  const n = cards.filter(c => !c.classList.contains('dup')).length;
  if (reduced) { cards.forEach(c => c.classList.add('landed', 'cleared')); return; }
  new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return;
    o.disconnect();
    cards.forEach((c, i) => {
      setTimeout(() => c.classList.add('landed'), reduced ? 0 : (i % n) * 95);
      setTimeout(() => c.classList.add('cleared'), reduced ? 0 : 1100 + (i % n) * 170);
    });
  }, { threshold: .35 }).observe(list.closest('.plat-wrap') || list);
});

/* ---- Inspector: findings flip to Removed / Kept one by one when it comes into view ---- */
document.querySelectorAll('[data-inspector]').forEach(p => {
  const rows = [...p.querySelectorAll('.insp-rows li')];
  const count = p.querySelector('[data-left]');
  const total = rows.filter(r => !r.classList.contains('keep')).length;
  const run = () => {
    let removed = 0;
    rows.forEach((r, i) => setTimeout(() => {
      r.classList.add('done');
      if (!r.classList.contains('keep')) removed++;
      count.textContent = removed < total ? `${total - removed} to remove` : `${total} removed`;
      if (i === rows.length - 1) { p.classList.add('all-done'); sparkle(p.querySelector('.insp-foot svg')).start(); setTimeout(() => sparkle(p.querySelector('.insp-foot svg')).stop(), 2200); }
    }, reduced ? 0 : 500 + i * 260));
  };
  if (reduced) { run(); return; }
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { run(); o.disconnect(); } }, { threshold: .45 }).observe(p);
});

/* ---- Hero phone: the app's scan. A scan line sweeps the photo, what the file carries pops up,
   each item is plucked off, then the clean copy lands with sparkle. Loops while on screen. ---- */
document.querySelectorAll('[data-pscan]').forEach(v => {
  const tags = [...v.querySelectorAll('.ps-tag')], status = v.querySelector('[data-ps-status]'), photo = v.querySelector('.ps-photo');
  const clean = () => { v.dataset.s = 'clean'; tags.forEach(t => t.classList.add('on', 'off')); status.textContent = 'Clean copy saved'; };
  if (reduced) { clean(); return; }
  let on = false, timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const run = () => {
    timers.forEach(clearTimeout); timers = [];
    v.dataset.s = 'scan'; status.textContent = 'Looking for the AI label…'; tags.forEach(t => t.classList.remove('on', 'off'));
    tags.forEach((t, i) => at(700 + i * 380, () => t.classList.add('on')));
    at(700 + tags.length * 380 + 150, () => { v.dataset.s = 'found'; status.textContent = 'AI label and private info found'; });
    const r0 = 700 + tags.length * 380 + 1500;
    tags.forEach((t, i) => at(r0 + i * 420, () => { t.classList.add('off'); status.textContent = `Removing ${i + 1} of ${tags.length}…`; }));
    const d0 = r0 + tags.length * 420 + 200;
    at(d0, () => { clean(); sparkle(photo).start(); });
    at(d0 + 2600, () => sparkle(photo).stop());
    at(d0 + 3400, () => on && run());
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; run(); }
    else if (!e.isIntersecting && on) { on = false; timers.forEach(clearTimeout); sparkle(photo).stop(); }
  }, { threshold: .3 }).observe(v);
});

/* ---- FAQ: open and close on the spring, both ways ---- */
{
  const easing = getComputedStyle(document.documentElement).getPropertyValue('--spring').trim() || 'cubic-bezier(.16,1,.3,1)';
  document.querySelectorAll('.faq details').forEach(d => {
    const s = d.querySelector('summary');
    if (d.open) d.classList.add('is-open');
    s.addEventListener('click', e => {
      e.preventDefault();
      const opening = !d.classList.contains('is-open');
      d.classList.toggle('is-open', opening);
      if (reduced) { d.open = opening; return; }
      const from = d.offsetHeight;
      if (opening) d.open = true;
      const to = opening ? d.offsetHeight : s.offsetHeight + (parseFloat(getComputedStyle(d).borderBottomWidth) || 0);
      d.anim?.cancel();
      d.style.overflow = 'hidden';
      d.anim = d.animate({ height: [`${from}px`, `${to}px`] }, { duration: 1000, easing });
      d.anim.onfinish = () => { if (!opening) d.open = false; d.style.overflow = ''; d.anim = null; };
    });
  });
}

/* ---- Nav: shadow once the page scrolls ---- */
{
  const nav = document.querySelector('.nav');
  const upd = () => nav.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', upd, { passive: true }); upd();
}

/* ---- Sparkles that run while visible ---- */
document.querySelectorAll('[data-sparkle]').forEach(el => { const s = sparkle(el); onView(el, () => s.start(), () => s.stop()); });

/* ---- Smooth scrolling on desktop (Lenis, MIT) ---- */
if (!reduced && matchMedia('(pointer: fine)').matches) {
  import('./lenis.js').then(({ default: Lenis }) => {
    window.lenis = new Lenis({ lerp: 0.1, autoRaf: true, anchors: { offset: -80 } });
  }).catch(() => {});
}
