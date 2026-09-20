// site/js/hero.js — character clip loops full-bleed; beside it the astronaut loop, with the five
// recognitions as glass cards orbiting him.
(function () {
  const { esc } = window.LIB;
  const DATA = window.DATA || {};
  const P = DATA.profile;
  const hero = document.querySelector('.hero');
  window.HERO = { el: hero };
  if (!P || !hero) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 767px)').matches;
  const video = hero.querySelector('.hero__video');
  const astro = hero.querySelector('.hero__orbit-video');
  // Text + link binding (headline, profile download)
  hero.querySelectorAll('[data-bind]').forEach(el => { el.textContent = P[el.dataset.bind] || ''; });
  hero.querySelectorAll('[data-bind-href]').forEach(el => { const v = P[el.dataset.bindHref]; if (v) el.setAttribute('href', v); else el.remove(); });
  const list = hero.querySelector('.hero__cards');
  // "Title · Sub" -> bold title + small sub line
  list.innerHTML = (P.recognitions || []).map(r => {
    const [t, ...rest] = r.split(' \u00b7 ');
    return `<li class="card"><b>${esc(t)}</b>${rest.length ? `<small>${esc(rest.join(' \u00b7 '))}</small>` : ''}</li>`;
  }).join('');
  const cards = [...list.children];

  // Orbit: tilted ellipse around the astronaut (box centre); a card is nearest the viewer at the bottom.
  const N = cards.length, PERIOD = 26000, RX = .36, RY = .27;
  function place(t) {
    const th = (t / PERIOD) * Math.PI * 2;
    cards.forEach((c, i) => {
      const a = th + (i / N) * Math.PI * 2;
      const cos = Math.cos(a), sin = Math.sin(a);      // sin > 0 = front
      const depth = (sin + 1) / 2;                       // 0 back .. 1 front
      const x = cos * RX * 100, y = sin * RY * 100 + Math.sin(t / 1400 + i) * 1.2 - 2;
      c.style.transform = `translate(calc(-50% + ${x}cqw), calc(-50% + ${y}cqw)) translateZ(${(depth - .5) * 260}px)` +
        ` rotateY(${-cos * 28}deg) rotateX(${(1 - depth) * 10}deg) scale(${.72 + depth * .34})`;
      c.style.opacity = (.45 + depth * .55).toFixed(3);
      c.style.filter = `blur(${((1 - depth) * 1.2).toFixed(2)}px)`;
      c.style.zIndex = Math.round(depth * 100);
    });
  }
  place(0);
  if (!reduced) requestAnimationFrame(function loop(t) { place(t); requestAnimationFrame(loop); });

  if (mobile) video.poster = 'media/hero-mobile-poster.jpg';
  if (reduced) return; // posters only

  const sources = mobile
    ? [['media/hero-mobile.mp4', 'video/mp4']]
    : [['media/hero.webm', 'video/webm'], ['media/hero.mp4', 'video/mp4']];
  video.innerHTML = sources.map(([src, type]) => `<source src="${src}" type="${type}">`).join('');
  video.preload = 'auto'; video.load();
  video.play().catch(() => { /* autoplay blocked: poster stays */ });

  astro.innerHTML = '<source src="media/astro.mp4" type="video/mp4">';
  astro.preload = 'auto'; astro.load();
  astro.play().catch(() => {});

  // Scroll: clips recede as dashboard slides over
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to('.hero__media', {
      scale: .94, filter: 'blur(6px) brightness(.45)', ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
  // Pause both clips when off-screen to save battery
  new IntersectionObserver(([e]) => {
    [video, astro].forEach(v => e.isIntersecting ? v.play().catch(() => {}) : v.pause());
  }).observe(hero);
})();
