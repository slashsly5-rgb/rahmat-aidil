// site/js/app.js — renders dashboard sections from window.DATA.
(function () {
  const L = window.LIB;
  const { esc } = L;
  const DATA = window.DATA || {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  const SECTIONS = [
    { id: 'career', label: 'Career' },
    { id: 'projects', label: 'AI Projects' },
    { id: 'academic', label: 'Academic' },
    { id: 'credentials', label: 'Credentials & Talks' },
    { id: 'contact', label: 'Contact' },
  ];

  const range = (a, b) => [a, b].filter(Boolean).map(esc).join(' – ');
  const opt = (v, wrap) => (v == null || v === '' ? '' : wrap(esc(v)));
  const head = (id, eyebrow, title, extra = '') =>
    `<div class="section__head"><p class="eyebrow">${eyebrow}</p><h2 id="${id}-h">${title}</h2>${extra}</div>`;

  function hideSection(el, key) {
    el.hidden = true;
    console.warn(`[dashboard] DATA.${key} missing — #${el.id} hidden`);
  }

  let rf;
  const refreshSoon = () => {
    if (!hasGsap) return;
    cancelAnimationFrame(rf);
    rf = requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  function reveal(root) {
    if (reduced || !hasGsap) return;
    root.querySelectorAll('.reveal').forEach(el => {
      gsap.from(el, { y: 28, opacity: 0, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
  }

  // ---------- nav ----------
  function renderNav() {
    const nav = document.getElementById('nav');
    const now = L.activeNow((DATA.profile && DATA.profile.now) || []);
    nav.innerHTML =
      `<a class="nav__brand" href="#top">RAD</a>
       <ul class="nav__links">${SECTIONS.map(s => `<li><a href="#${s.id}">${esc(s.label)}</a></li>`).join('')}</ul>
       ${now.length ? `<p class="nav__now"><span class="nav__dot" aria-hidden="true"></span>Now: ${esc(now[0].text)}</p>` : ''}`;
    const hero = window.HERO && window.HERO.el;
    if (hero) new IntersectionObserver(([e]) => nav.classList.toggle('is-visible', !e.isIntersecting), { threshold: .1 }).observe(hero);
    else nav.classList.add('is-visible');
    const links = [...nav.querySelectorAll('.nav__links a')];
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-active', a.hash === `#${e.target.id}`));
    }), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) io.observe(el); });
  }

  // ---------- career: command-centre scene, 6 most recent major roles as floating windows ----------
  const CW_MAX = 6;
  const CW_ACCENTS = ['#22d3ee', '#fb923c', '#a855f7', '#ec4899', '#19e39b', '#60a5fa'];
  // window slots as % of the scene box: [left, top]; 3 per side, staggered
  const CW_SLOTS = [[4, 15], [71, 13], [2, 43], [73, 42], [5, 71], [70, 70]];
  const CW_ICON = {
    job: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
    side: 'M12 3l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8L6.7 19.6l1-6L3.3 9.4l6-.9z',
  };
  const CW_CORE_Y = 343 / 896; // centre of the plasma ball in media/career-room.jpg (px / image height)
  // Electric border: two pairs of scrolling turbulence displace a plain border so it crackles like live current.
  const CW_DEFS = `<svg class="cw__defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
    <filter id="cw-electric" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="5" seed="1" result="n1"/>
      <feOffset in="n1" result="o1"><animate attributeName="dy" values="600;0" dur="5s" repeatCount="indefinite"/></feOffset>
      <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="5" seed="1" result="n2"/>
      <feOffset in="n2" result="o2"><animate attributeName="dy" values="0;-600" dur="5s" repeatCount="indefinite"/></feOffset>
      <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="5" seed="2" result="n3"/>
      <feOffset in="n3" result="o3"><animate attributeName="dx" values="500;0" dur="5s" repeatCount="indefinite"/></feOffset>
      <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="5" seed="2" result="n4"/>
      <feOffset in="n4" result="o4"><animate attributeName="dx" values="0;-500" dur="5s" repeatCount="indefinite"/></feOffset>
      <feComposite in="o1" in2="o2" result="p1"/><feComposite in="o3" in2="o4" result="p2"/>
      <feBlend in="p1" in2="p2" mode="color-dodge" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="B"/>
    </filter>
    <filter id="cw-electric-thin" x="-5%" y="-40%" width="110%" height="180%">
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="4" result="n">
        <animate attributeName="seed" values="4;9;2;7;5;1;8;3" dur="0.8s" repeatCount="indefinite" calcMode="discrete"/></feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>
    </filter></defs></svg>`;
  const cwIcon = k => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${CW_ICON[k]}"/></svg>`;

  function renderCareer() {
    const C = DATA.career;
    const el = document.getElementById('career');
    if (!C) { hideSection(el, 'career'); return; }
    const yr = s => (s ? String(s).slice(0, 4) : '');
    const nowY = new Date().getFullYear();
    const roles = [
      ...(C.jobs || []).map(j => ({ kind: 'job', ...j })),
      ...(C.sideRoles || []).map(r => ({ kind: 'side', ...r })),
    ].filter(r => r.start).sort((a, b) => String(b.start).localeCompare(String(a.start))).slice(0, CW_MAX);

    const win = (r, i) => {
      const active = r.end === 'Present';
      const y0 = +yr(r.start), y1 = active ? nowY : (+yr(r.end) || y0);
      const yrs = Math.max(1, y1 - y0 + (active ? 0 : 1));
      const [l, t] = CW_SLOTS[i] || [0, 0];
      const side = l < 50 ? 'l' : 'r';
      return `<article class="cw__win reveal cw__win--${side}" style="--accent:${CW_ACCENTS[i % CW_ACCENTS.length]};--l:${l}%;--t:${t}%;order:${i}">
        <header class="cw__bar">${cwIcon(r.kind)}<h3 class="cw__title">${esc(r.title)}</h3><span class="cw__ctl" aria-hidden="true"><i></i><i></i><i></i></span></header>
        <div class="cw__body">
          ${opt([r.title === r.org ? '' : r.org, r.place].filter(Boolean).join(' · '), v => `<p class="cw__org">${v}</p>`)}
          <div class="cw__tiles">
            <div class="cw__tile"><small>Tenure</small><b>${range(yr(r.start), r.end)}</b></div>
            <div class="cw__tile"><small>${active ? 'Running' : 'Duration'}</small><b>${yrs} yr${yrs > 1 ? 's' : ''}</b></div>
          </div>
          ${opt(r.focus, v => `<p class="cw__focus">${v}</p>`)}
          <p class="cw__foot"><span class="cw__tag">${r.kind === 'side' ? 'In parallel' : 'Position'}</span>
            <span class="cw__bar-line"><i style="width:${active ? 100 : Math.min(100, yrs * 12)}%"></i></span>
            <span class="cw__status${active ? ' is-active' : ''}">${active ? 'Active' : 'Complete'}</span></p>
        </div></article>`;
    };

    el.innerHTML = `<div class="cw">
      <div class="cw__scene">
        <div class="cw__head">
          <h2 id="career-h">Career System <span>v${roles.length}.0</span></h2>
          <p class="cw__sys"><span class="cw__live">Neural network active</span> &nbsp;·&nbsp; ${roles.length} most recent roles</p>
        </div>
        <svg class="cw__cables" aria-hidden="true"></svg>
        ${CW_DEFS}
        <div class="cw__core" aria-hidden="true">
          <span class="cw__halo"></span><span class="cw__plasma"></span><span class="cw__plasma cw__plasma--b"></span>
          <span class="cw__ring cw__ring--a"></span><span class="cw__ring cw__ring--b"></span><span class="cw__ring cw__ring--arc"></span>
          <span class="cw__orbit"><i></i><i></i><i></i><i></i><i></i><i></i></span>
          <span class="cw__label"><small>Neural core</small><b>AI</b></span>
        </div>
        ${roles.map(win).join('')}
      </div>
      <p class="cw__note muted small">Full career history is in the <a href="cv/Rahmat-Aidil-Profile.pdf" download>profile</a>.</p>
    </div>`;

    // Cables: bezier from each window's inner edge to the painted core, drawn from live rects.
    const scene = el.querySelector('.cw__scene'), svg = el.querySelector('.cw__cables');
    const wins = [...el.querySelectorAll('.cw__win')];
    if (reduced) el.querySelectorAll('.cw__defs animate').forEach(a => a.remove());
    function drawCables() {
      if (matchMedia('(max-width: 899px)').matches) { svg.innerHTML = ''; return; }
      const g = scene.getBoundingClientRect();
      if (g.bottom < -200 || g.top > innerHeight + 200) return;
      const cx = g.width / 2, cy = g.height * CW_CORE_Y; // painted core centre in the room image
      svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
      svg.innerHTML = wins.map((w, i) => {
        const b = w.getBoundingClientRect();
        const left = b.left + b.width / 2 - g.left < cx;
        const x = (left ? b.right : b.left) - g.left, y = b.top + b.height / 2 - g.top;
        const dx = Math.max(80, Math.abs(cx - x) * .6), c1 = left ? x + dx : x - dx, c2 = left ? cx - dx : cx + dx;
        const col = CW_ACCENTS[i % CW_ACCENTS.length];
        return `<path d="M${x},${y} C${c1},${y} ${c2},${cy} ${cx},${cy}" stroke="${col}" style="color:${col}"/><circle cx="${x}" cy="${y}" r="4" fill="${col}" style="color:${col}"/>`;
      }).join('');
    }
    let raf = 0;
    const queue = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawCables(); }); };
    drawCables();
    addEventListener('resize', queue);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
    setTimeout(queue, 1200); // after reveal tweens settle
  }

  // ---------- custom AI tools: one-screen circuit map; tools pop out one by one where each trace ends ----------
  // Hubs clockwise from top-left; x/y and leaf slots in the 1600x1000 viewBox.
  // Slots sit on a 165 x 120 grid so tiles and 2-line labels never overlap.
  const HUBS = [
    { name: 'Data & Insights', color: '#38bdf8', x: 470, y: 250, slots: [[100, 95], [265, 95], [430, 95], [595, 95], [100, 215], [100, 335]] },
    { name: 'Marketing & Content', color: '#fb923c', x: 1130, y: 250, slots: [[1500, 95], [1335, 95], [1170, 95], [1005, 95], [1500, 215], [1500, 335]] },
    { name: 'Image & Video Studio', color: '#22d3ee', x: 1280, y: 560, slots: [[1500, 455], [1500, 575], [1500, 695], [1335, 695], [1170, 695], [1005, 455], [1005, 695]] },
    { name: 'Productivity & Learning', color: '#a78bfa', x: 1120, y: 860, slots: [[1500, 815], [1335, 935], [900, 935]] },
    { name: 'Voice & Audio', color: '#f472b6', x: 480, y: 860, slots: [[100, 815], [265, 935], [700, 935]] },
    { name: 'Chat & Service Agents', color: '#34d399', x: 320, y: 560, slots: [[100, 455], [100, 575], [100, 695], [265, 695], [430, 695], [595, 455]] },
  ];
  const HUB_CX = 800, HUB_CY = 540, HUB_W = 236, HUB_H = 66, LEAF = 66;
  // Pictograms (24x24, stroked). Chosen per tool by name keywords, falling back to its first tech tag.
  const PICTO = {
    mic: 'M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3M8 21h8',
    film: 'M3 5h18v14H3zM3 9h18M3 15h18M7 5v4M7 15v4M17 5v4M17 15v4M10.5 10.5l3 1.5-3 1.5z',
    image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3',
    pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4M4 20l2-2',
    wand: 'M4 20L15 9M15 9l2-2M13 7l4 4M18 3v3M16.5 4.5h3M20 9v2M19 10h2M9 4v2M8 5h2',
    chat: 'M4 5h16v11H9l-5 4zM8 10.5h.01M12 10.5h.01M16 10.5h.01',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z',
    car: 'M5 16h14M3 16v-3l2-5h14l2 5v3M6 16v2M18 16v2M7.5 13h.01M16.5 13h.01',
    megaphone: 'M3 10v4h4l7 4V6L7 10zM17 9a4 4 0 010 6M19.5 7a7 7 0 010 10',
    cart: 'M3 4h2l2.5 11h10L20 7H6.5M9 19.5a1 1 0 100-.01M17 19.5a1 1 0 100-.01',
    recycle: 'M7 7l3-4 3 4M10 3v8M17 13l4 3-4 3M21 16h-8M7 21l-4-3 4-3M3 18h8',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    line: 'M3 17l5-6 4 3 5-7 4 4M3 21h18',
    database: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
    layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
    route: 'M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM8 17h7a3 3 0 000-6H9a3 3 0 010-6h7',
    users: 'M16 20v-2a4 4 0 00-8 0v2M12 12a4 4 0 100-8 4 4 0 000 8zM20 20v-2a4 4 0 00-3-3.9M4 20v-2a4 4 0 013-3.9',
    book: 'M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2zM4 19a2 2 0 012-2h12M8 7h6',
    calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h3v3H8z',
    headset: 'M4 14v-2a8 8 0 0116 0v2M4 14h3v5H4zM17 14h3v5h-3zM20 19a3 3 0 01-3 3h-4',
    robot: 'M8 8h8a3 3 0 013 3v6a3 3 0 01-3 3H8a3 3 0 01-3-3v-6a3 3 0 013-3zM12 4v4M9.5 13h.01M14.5 13h.01M9 17h6',
    doc: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7',
    gear: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  };
  const PICTO_RULES = [
    [/speech|voice/i, 'mic'], [/feedback|coach/i, 'headset'], [/sora|veo|video gen|story animator|text to video/i, 'film'],
    [/frame|video-to|video prompt|prompt enhancer/i, 'film'], [/image/i, 'image'], [/storyboard|script/i, 'pen'],
    [/prompter|prompt/i, 'wand'], [/whatsapp/i, 'phone'], [/automo|car\b/i, 'car'], [/\bad\b|ads|viral/i, 'megaphone'],
    [/e-commerce|lister/i, 'cart'], [/repurpos/i, 'recycle'], [/dashboard/i, 'chart'], [/analy[sz]er|performance/i, 'line'],
    [/vector|knowledge/i, 'database'], [/data lake/i, 'layers'], [/journey/i, 'route'], [/hr &|student analytics/i, 'users'],
    [/research/i, 'book'], [/timetable|schedul/i, 'calendar'], [/agent|chat|journey|service/i, 'chat'],
  ];
  const TECH_PICTO = { Voice: 'mic', Vision: 'image', Chatbot: 'chat', Automation: 'gear', Dashboards: 'chart', RAG: 'database', 'Document AI': 'doc', Agents: 'robot' };
  const pictoFor = t => (PICTO_RULES.find(([re]) => re.test(t.name)) || [0, TECH_PICTO[(t.tech || [])[0]] || 'robot'])[1];
  const svgIcon = (d, x, y, size, sw = 1.7) => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

  // Orthogonal route with rounded corners (circuit-trace look).
  function orthPath(pts, r = 26) {
    pts = pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > .5);
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1];
      const l1 = Math.hypot(cx - px, cy - py), l2 = Math.hypot(nx - cx, ny - cy), rr = Math.min(r, l1 / 2, l2 / 2);
      const ax = cx - (cx - px) / l1 * rr, ay = cy - (cy - py) / l1 * rr, bx = cx + (nx - cx) / l2 * rr, by = cy + (ny - cy) / l2 * rr;
      d += ` L${ax.toFixed(1)},${ay.toFixed(1)} Q${cx},${cy} ${bx.toFixed(1)},${by.toFixed(1)}`;
    }
    const e = pts[pts.length - 1];
    return d + ` L${e[0].toFixed(1)},${e[1].toFixed(1)}`;
  }
  // Split a label into at most 2 lines of ~lim chars.
  function wrap2(t, lim = 17) {
    const w = String(t).split(/\s+/), out = [''];
    w.forEach(word => { const cur = out[out.length - 1]; if ((cur + ' ' + word).trim().length > lim && cur) out.push(word); else out[out.length - 1] = (cur + ' ' + word).trim(); });
    if (out.length > 2) { out[1] = out.slice(1).join(' '); out.length = 2; if (out[1].length > lim + 2) out[1] = out[1].slice(0, lim) + '…'; }
    return out;
  }
  // Deterministic pseudo-random (same background every load).
  const rng = seed => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // Faint circuit-board texture: short orthogonal traces with pads, avoiding nothing (it sits behind everything).
  function circuitBg() {
    const r = rng(7), out = [];
    for (let i = 0; i < 70; i++) {
      let x = Math.round(r() * 1560 + 20), y = Math.round(r() * 960 + 20);
      const pts = [[x, y]];
      for (let k = 0; k < 2 + Math.floor(r() * 3); k++) {
        const len = 30 + Math.round(r() * 90);
        if (k % 2 === 0) x += (r() < .5 ? -1 : 1) * len; else y += (r() < .5 ? -1 : 1) * len;
        pts.push([x, y]);
      }
      out.push(`<path d="${orthPath(pts, 8)}"/><circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="2.6"/><circle cx="${x}" cy="${y}" r="3.2" class="hm__pad"/>`);
    }
    return out.join('');
  }

  // Decorative mini dashboards and gizmos placed in free spaces (like the reference poster).
  const DECOR = [
    { k: 'line', x: 800, y: 150, c: '#38bdf8' }, { k: 'bars', x: 520, y: 395, c: '#38bdf8' }, { k: 'list', x: 1080, y: 395, c: '#fb923c' },
    { k: 'ring', x: 265, y: 455, c: '#34d399' }, { k: 'ring', x: 1335, y: 455, c: '#22d3ee' }, { k: 'bars', x: 1500, y: 945, c: '#a78bfa' },
    { k: 'list', x: 110, y: 945, c: '#f472b6' }, { k: 'donut', x: 800, y: 940, c: '#22d3ee' },
  ];
  function decor(d) {
    const W = 120, H = 70, x0 = d.x - W / 2, y0 = d.y - H / 2;
    const frame = `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" rx="8" class="hm__widget"/>`;
    if (d.k === 'bars') return frame + [.55, .8, .4, .95, .65, .75].map((h, i) =>
      `<rect class="hm__bar" style="animation-delay:${-i * .37}s" x="${x0 + 14 + i * 16}" y="${y0 + 12}" width="9" height="${H - 24}" transform-origin="${x0 + 18 + i * 16} ${y0 + H - 12}" transform="scale(1 ${h})"/>`).join('');
    if (d.k === 'line') return frame + `<path class="hm__spark-line" d="M${x0 + 10},${y0 + 52} L${x0 + 30},${y0 + 40} L${x0 + 48},${y0 + 46} L${x0 + 66},${y0 + 26} L${x0 + 86},${y0 + 32} L${x0 + 108},${y0 + 14}"/>` +
      `<path d="M${x0 + 10},${y0 + 60} H${x0 + 110}" class="hm__axis"/>`;
    if (d.k === 'list') return frame + [0, 1, 2, 3].map(i =>
      `<circle cx="${x0 + 16}" cy="${y0 + 15 + i * 14}" r="3" class="hm__dotc"/><rect class="hm__row" style="animation-delay:${-i * .5}s" x="${x0 + 26}" y="${y0 + 12 + i * 14}" width="${[78, 60, 70, 48][i]}" height="6" rx="3"/>`).join('');
    if (d.k === 'donut') return `<circle cx="${d.x}" cy="${d.y}" r="26" class="hm__donut-bg"/><circle cx="${d.x}" cy="${d.y}" r="26" class="hm__donut" transform="rotate(-90 ${d.x} ${d.y})"/>` +
      `<text x="${d.x}" y="${d.y + 5}" class="hm__donut-t">93%</text>`;
    return `<circle cx="${d.x}" cy="${d.y}" r="24" class="hm__gizmo"/><circle cx="${d.x}" cy="${d.y}" r="15" class="hm__gizmo hm__gizmo--b"/><circle cx="${d.x}" cy="${d.y}" r="4" class="hm__dotc"/>`;
  }

  function renderHubmap(box, tools) {
    const groups = HUBS.map(h => ({ ...h, items: [] }));
    tools.forEach(t => (groups.find(g => g.name === t.group) || groups.reduce((a, b) => (b.items.length < a.items.length ? b : a))).items.push(t));
    const hubs = groups.filter(g => g.items.length);
    hubs.forEach(h => {
      const base = Math.atan2(h.y - HUB_CY, h.x - HUB_CX), n = h.items.length;
      const step = Math.min(34, 150 / Math.max(1, n - 1)) * Math.PI / 180;
      h.leaves = h.items.map((t, j) => {
        if (h.slots && h.slots[j]) return { t, x: h.slots[j][0], y: h.slots[j][1] };
        const a = base + (j - (n - 1) / 2) * step;
        return { t, x: Math.min(1520, Math.max(80, h.x + Math.cos(a) * 250)), y: Math.min(935, Math.max(70, h.y + Math.sin(a) * 185)) };
      });
    });

    // Trunk: a fan of 5 curved glowing strands from the core rim into the side of the hub.
    const trunk = h => {
      const ux = h.x - HUB_CX, uy = h.y - HUB_CY, ul = Math.hypot(ux, uy), nx = ux / ul, ny = uy / ul, px = -ny, py = nx;
      const sx = Math.sign(ux) || 1, ex = h.x - sx * HUB_W / 2;
      return [-16, -8, 0, 8, 16].map(o => {
        const s0 = [HUB_CX + nx * 92 + px * o * .45, HUB_CY + ny * 92 + py * o * .45];
        const c1 = [HUB_CX + nx * 230 + px * o, HUB_CY + ny * 230 + py * o];
        const c2 = [ex - sx * 170, h.y + o * .9];
        const e = [ex, h.y + o * .45];
        return { d: `M${s0.map(v => v.toFixed(1))} C${c1.map(v => v.toFixed(1))} ${c2.map(v => v.toFixed(1))} ${e.map(v => v.toFixed(1))}`, o };
      });
    };
    const branch = (h, l) => {
      const dx = l.x - h.x, dy = l.y - h.y;
      const pts = Math.abs(dx) > Math.abs(dy) * .8
        ? [[h.x + Math.sign(dx) * HUB_W / 2, h.y], [h.x + dx * .5, h.y], [h.x + dx * .5, l.y], [l.x, l.y]]
        : [[h.x, h.y + Math.sign(dy) * HUB_H / 2], [h.x, h.y + dy * .5], [l.x, h.y + dy * .5], [l.x, l.y]];
      return orthPath(pts, 18);
    };

    let defs = '', paths = '', nodes = '';
    hubs.forEach((h, hi) => {
      defs += `<linearGradient id="hm-g${hi}" gradientUnits="userSpaceOnUse" x1="${HUB_CX}" y1="${HUB_CY}" x2="${h.x}" y2="${h.y}"><stop offset="0" stop-color="#e0fbff"/><stop offset=".12" stop-color="#67e8f9"/><stop offset=".3" stop-color="${h.color}"/><stop offset="1" stop-color="${h.color}"/></linearGradient>
        <linearGradient id="hm-t${hi}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${h.color}" stop-opacity=".95"/><stop offset="1" stop-color="${h.color}" stop-opacity=".35"/></linearGradient>`;
      trunk(h).forEach(st => {
        const main = st.o === 0;
        paths += `<path class="hm__trace hm__trace--trunk${main ? ' hm__trace--main' : ''}" style="stroke:url(#hm-g${hi});stroke-width:${main ? 4.5 : 2.2 + (16 - Math.abs(st.o)) / 12}px" data-hub="${hi}" d="${st.d}"/>
          <path class="hm__packet" style="color:${h.color}" data-hub="${hi}" d="${st.d}"/>`;
      });
      h.leaves.forEach((l, j) => {
        const d = branch(h, l);
        paths += `<g style="color:${h.color}"><path class="hm__trace hm__trace--leaf" data-hub="${hi}" data-leaf="${j}" d="${d}"/><path class="hm__trace hm__trace--core" data-hub="${hi}" data-leaf="${j}" d="${d}"/>
          <path class="hm__packet hm__packet--leaf" data-hub="${hi}" data-leaf="${j}" d="${d}"/></g>`;
        const lines = wrap2(l.t.name);
        nodes += `<g class="hm__leaf" data-hub="${hi}" data-leaf="${j}" tabindex="0" role="img" aria-label="${esc(l.t.name)}: ${esc(l.t.summary)}" style="color:${h.color}" transform="translate(${l.x},${l.y})">
          <circle class="hm__spark" r="6"/>
          <rect class="hm__tile" x="${-LEAF / 2}" y="${-LEAF / 2 - 16}" width="${LEAF}" height="${LEAF}" rx="12" style="fill:url(#hm-t${hi})"/>
          <rect class="hm__tile-in" x="${-LEAF / 2 + 5}" y="${-LEAF / 2 - 11}" width="${LEAF - 10}" height="${LEAF - 10}" rx="9"/>
          <path class="hm__tile-shine" d="M${-LEAF / 2 + 6},${-LEAF / 2 - 4} q0,-6 6,-6 h${LEAF - 24} q6,0 6,6 v6 h-${LEAF - 12} z"/>
          <g class="hm__picto">${svgIcon(PICTO[pictoFor(l.t)], -19, -35, 38, 1.8)}</g>
          <text class="hm__label" y="${LEAF / 2 + 8}">${lines.map((ln, k) => `<tspan x="0" dy="${k ? 16 : 0}">${esc(ln.toUpperCase())}</tspan>`).join('')}</text>
        </g>`;
      });
      const hl = wrap2(h.name, 14);
      nodes += `<g class="hm__hub" id="t-${L.slug(h.name)}" data-hub="${hi}" style="color:${h.color}" transform="translate(${h.x},${h.y})">
        <rect class="hm__hub-glow" x="${-HUB_W / 2 - 8}" y="${-HUB_H / 2 - 8}" width="${HUB_W + 16}" height="${HUB_H + 16}" rx="18"/>
        <rect class="hm__hub-box" x="${-HUB_W / 2}" y="${-HUB_H / 2}" width="${HUB_W}" height="${HUB_H}" rx="13"/>
        <path class="hm__tile-shine" d="M${-HUB_W / 2 + 8},${-HUB_H / 2 + 12} q0,-7 8,-7 h${HUB_W - 32} q8,0 8,7 v5 h-${HUB_W - 16} z"/>
        <circle class="hm__jn" cx="${-HUB_W / 2}" cy="0" r="5"/><circle class="hm__jn" cx="${HUB_W / 2}" cy="0" r="5"/>
        <text y="${hl.length > 1 ? -4 : 8}">${hl.map((ln, k) => `<tspan x="0" dy="${k ? 22 : 0}">${esc(ln.toUpperCase())}</tspan>`).join('')}</text>
      </g>`;
    });

    const ticks = Array.from({ length: 60 }, (_, i) => { const a = i * 6 * Math.PI / 180, r1 = 104, r2 = i % 5 ? 109 : 115;
      return `<line x1="${(Math.cos(a) * r1).toFixed(1)}" y1="${(Math.sin(a) * r1).toFixed(1)}" x2="${(Math.cos(a) * r2).toFixed(1)}" y2="${(Math.sin(a) * r2).toFixed(1)}"/>`; }).join('');

    box.innerHTML = `
      <div class="hm__head"><h3 class="hm__title">Custom AI Agents &amp; Tools</h3>
        <p class="hm__sub">${tools.length} tools · ${hubs.length} capabilities · one central engine</p></div>
      <svg class="hm__svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid meet">
        <defs>${defs}
          <filter id="hm-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="hm-glow2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="hm-core" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#a5f3fc"/><stop offset=".35" stop-color="#0891b2"/><stop offset=".8" stop-color="#0b2a4a"/><stop offset="1" stop-color="#061425"/></radialGradient>
          <radialGradient id="hm-bgglow" cx="50%" cy="54%" r="55%"><stop offset="0" stop-color="#0e7490" stop-opacity=".35"/><stop offset="1" stop-color="#0e7490" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="1600" height="1000" fill="url(#hm-bgglow)"/>
        <g class="hm__bg">${circuitBg()}</g>
        <g class="hm__decor">${DECOR.map(decor).join('')}</g>
        <g class="hm__paths">${paths}</g>
        <g class="hm__core" transform="translate(${HUB_CX},${HUB_CY})">
          <circle class="hm__core-halo" r="150"/>
          <g class="hm__core-ticks">${ticks}</g>
          <circle class="hm__core-ring hm__core-ring--a" r="98"/><circle class="hm__core-ring hm__core-ring--b" r="122"/><circle class="hm__core-ring hm__core-ring--c" r="88"/>
          <circle class="hm__core-disc" r="80"/>
          <g class="hm__core-orbit"><circle cx="0" cy="-122" r="5"/><circle cx="0" cy="122" r="4"/><circle cx="122" cy="0" r="3"/></g>
          <text class="hm__core-text" y="-6"><tspan x="0">CENTRAL</tspan><tspan x="0" dy="27">AI ENGINE</tspan></text>
        </g>
        <g class="hm__nodes">${nodes}</g>
      </svg>
      <div class="hm__tip" hidden></div>
      <div class="hm__list">${hubs.map(h => `<section class="hm__group" style="--c:${h.color}"><h4>${esc(h.name)}</h4>
        <ul>${h.items.map(t => `<li><b>${esc(t.name)}</b><span>${esc(t.summary)}</span></li>`).join('')}</ul></section>`).join('')}</div>`;

    const svg = box.querySelector('.hm__svg');
    const q = sel => [...svg.querySelectorAll(sel)];
    q('.hm__trace, .hm__packet').forEach(p => { const L = p.getTotalLength(); p.dataset.len = L;
      if (p.classList.contains('hm__trace')) { p.style.strokeDasharray = `${L}px ${L}px`; p.style.strokeDashoffset = `${L}px`; } });

    const tip = box.querySelector('.hm__tip');
    q('.hm__leaf').forEach(g => {
      const t = hubs[g.dataset.hub].leaves[g.dataset.leaf].t;
      const show = () => { const r = g.getBoundingClientRect(), b = box.getBoundingClientRect();
        tip.innerHTML = `<b>${esc(t.name)}</b><span>${esc(t.summary)}</span>`; tip.hidden = false;
        tip.style.left = `${Math.min(b.width - 290, Math.max(10, r.left - b.left + r.width / 2 - 140))}px`; tip.style.top = `${r.bottom - b.top + 8}px`; };
      const hide = () => { tip.hidden = true; };
      g.addEventListener('mouseenter', show); g.addEventListener('focus', show); g.addEventListener('mouseleave', hide); g.addEventListener('blur', hide);
    });

    const finish = () => { box.classList.add('is-done'); q('.hm__trace').forEach(p => { p.style.strokeDashoffset = '0px'; }); q('.hm__packet').forEach(p => p.classList.add('is-on')); };
    if (reduced || !svg.animate) { box.classList.add('is-static'); finish(); return; }

    const draw = (p, delay, dur) => p.animate([{ strokeDashoffset: `${p.dataset.len}px` }, { strokeDashoffset: '0px' }], { duration: dur, delay, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' });
    // SVG transform attributes are unitless; CSS transforms need px.
    const cssT = g => g.getAttribute('transform').replace(/translate\(([-\d.]+),\s*([-\d.]+)\)/, 'translate($1px,$2px)');
    const pop = (g, delay, dur = 560) => g.animate([{ opacity: 0, transform: `${cssT(g)} scale(.2)` }, { opacity: 1, transform: `${cssT(g)} scale(1.15)`, offset: .7 }, { opacity: 1, transform: `${cssT(g)} scale(1)` }],
      { duration: dur, delay, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
    const live = (p, delay) => setTimeout(() => p.classList.add('is-on'), delay);

    function play() {
      box.classList.add('is-playing');
      svg.querySelector('.hm__core').animate([{ opacity: 0, transform: `translate(${HUB_CX}px,${HUB_CY}px) scale(.3)` }, { opacity: 1, transform: `translate(${HUB_CX}px,${HUB_CY}px) scale(1)` }], { duration: 800, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'both' });
      svg.querySelector('.hm__bg').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1600, fill: 'both' });
      let last = 0;
      hubs.forEach((h, hi) => {
        const t0 = 500 + hi * 560;
        q(`.hm__trace--trunk[data-hub="${hi}"]`).forEach((p, k) => draw(p, t0 + Math.abs(k - 2) * 70, 950));
        q(`.hm__packet:not(.hm__packet--leaf)[data-hub="${hi}"]`).forEach((p, k) => live(p, t0 + 1050 + k * 90));
        pop(svg.querySelector(`.hm__hub[data-hub="${hi}"]`), t0 + 850);
        h.leaves.forEach((l, j) => {
          const tl = t0 + 1200 + j * 270;
          q(`.hm__trace--leaf[data-hub="${hi}"][data-leaf="${j}"], .hm__trace--core[data-hub="${hi}"][data-leaf="${j}"]`).forEach(p => draw(p, tl, 540));
          const leaf = svg.querySelector(`.hm__leaf[data-hub="${hi}"][data-leaf="${j}"]`);
          pop(leaf, tl + 480);
          leaf.querySelector('.hm__spark').animate([{ r: '4px', opacity: 1, strokeWidth: '4px' }, { r: '52px', opacity: 0, strokeWidth: '1px' }], { duration: 750, delay: tl + 480, easing: 'ease-out', fill: 'both' });
          live(svg.querySelector(`.hm__packet--leaf[data-hub="${hi}"][data-leaf="${j}"]`), tl + 600);
          last = Math.max(last, tl + 1100);
        });
      });
      q('.hm__decor > *').forEach((d, i) => d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 1400 + i * 120, fill: 'both' }));
      setTimeout(() => box.classList.add('is-done'), last);
    }
    q('.hm__hub, .hm__leaf, .hm__decor > *').forEach(g => { g.style.opacity = 0; });
    svg.querySelector('.hm__core').style.opacity = 0;
    svg.querySelector('.hm__bg').style.opacity = 0;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); play(); } }, { threshold: .35 });
    io.observe(svg);
  }

  // ---------- projects: zigzag flow of glowing medallions + panels, joined by a scroll-drawn light stream ----------
  const FLOW_ACCENTS = ['#f5b73b', '#a855f7', '#ec4899', '#fb923c', '#19e39b', '#3b82f6'];
  const SECTOR_IMG = s => `media/sectors/${String(s || 'enterprise').toLowerCase()}.jpg`;
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>';

  function renderProjects() {
    const P = DATA.projects;
    const el = document.getElementById('projects');
    if (!P) { hideSection(el, 'projects'); return; }
    const platforms = P.platforms || [], tools = P.tools || [];
    const FILTERS = [['sector', 'Sector'], ['clientType', 'Client'], ['tech', 'Tech']];
    const state = Object.fromEntries(FILTERS.map(([k]) => [k, null]));
    const sectors = L.uniqueValues(platforms, 'sector');
    const tags = t => (t || []).map(x => `<span class="tag">${esc(x)}</span>`).join('');
    const LABEL_POS = ['flow__lab--a', 'flow__lab--b', 'flow__lab--c'];

    const row = (p, i) => {
      const labels = [...(p.tech || []).slice(0, 2), p.clientType].filter(Boolean).slice(0, 3);
      const checks = [
        p.academic && `<b>Academia:</b> ${esc(p.academic)}`,
        p.industry && `<b>Industry:</b> ${esc(p.industry)}`,
        [p.status, p.clientType && `${p.clientType} client`].filter(Boolean).map(esc).join(' · '),
      ].filter(Boolean);
      return `<li class="flow__row" id="p-${L.slug(p.name)}" style="--accent:${FLOW_ACCENTS[i % FLOW_ACCENTS.length]}">
        <div class="flow__medal">
          <span class="flow__num" aria-hidden="true">${i + 1}</span>
          <span class="flow__ring flow__ring--a" aria-hidden="true"></span><span class="flow__ring flow__ring--b" aria-hidden="true"></span>
          <div class="flow__disc">
            <img src="${SECTOR_IMG(p.sector)}" alt="" loading="lazy" decoding="async">
            ${labels.map((t, k) => `<span class="flow__lab ${LABEL_POS[k]}">${esc(t)}</span>`).join('')}
            <span class="flow__cap">${esc(p.sector)}</span>
          </div>
        </div>
        <article class="flow__panel">
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.summary)}</p>
          ${checks.length ? `<ul class="flow__checks">${checks.map(c => `<li>${CHECK}<span>${c}</span></li>`).join('')}</ul>` : ''}
          <div class="tags">${tags(p.tech)}</div>
        </article>
      </li>`;
    };

    el.innerHTML = head('projects', 'AI Projects', 'Systems built, deployed and in use',
      `<p class="counters"><b>${platforms.length}</b> platforms · <b>${tools.length}</b> agents &amp; tools · <b>${sectors.length}</b> sectors</p>`) +
      `<div class="filters" role="group" aria-label="Filter projects">${FILTERS.map(([k, label]) => {
        const vals = L.uniqueValues(platforms, k);
        return vals.length ? `<div class="filters__row"><span class="filters__label">${label}</span>
          <button class="chip is-active" data-k="${k}" data-v="" aria-pressed="true">All</button>${vals.map(v => `<button class="chip" data-k="${k}" data-v="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join('')}</div>` : '';
      }).join('')}</div>
      <div class="flow">
        <p class="flow__pill"><span>Systems Built</span></p>
        <svg class="flow__stream" aria-hidden="true">
          <defs><linearGradient id="flow-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000"></linearGradient></defs>
          <path class="flow__base"/><path class="flow__lit"/><circle class="flow__head" r="7"/>
        </svg>
        <ol class="flow__list">${platforms.map(row).join('')}</ol>
        <p class="flow__empty" hidden>No platforms match these filters.</p>
      </div>
      ${tools.length ? `<div class="hubmap" aria-label="Custom AI agents and tools"></div>` : ''}`;

    if (tools.length) renderHubmap(el.querySelector('.hubmap'), tools);
    const flow = el.querySelector('.flow'), list = el.querySelector('.flow__list');
    const rows = [...el.querySelectorAll('.flow__row')];
    const svg = el.querySelector('.flow__stream'), grad = svg.querySelector('#flow-grad');
    const base = svg.querySelector('.flow__base'), lit = svg.querySelector('.flow__lit'), headDot = svg.querySelector('.flow__head');
    let len = 0;

    // Alternate sides and renumber over the rows that are currently visible.
    function layout() {
      rows.filter(r => r.style.display !== 'none').forEach((r, k) => {
        r.classList.toggle('flow__row--r', k % 2 === 1);
        r.querySelector('.flow__num').textContent = k + 1;
      });
    }

    // Stream path: smooth S-curves through each visible medallion centre.
    function drawPath() {
      const vis = rows.filter(r => r.style.display !== 'none');
      const f = flow.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${f.width} ${f.height}`);
      if (vis.length < 2 || matchMedia('(max-width: 767px)').matches) { base.setAttribute('d', ''); lit.setAttribute('d', ''); len = 0; return; }
      const pts = vis.map(r => { const m = r.querySelector('.flow__disc').getBoundingClientRect(); return [m.left + m.width / 2 - f.left, m.top + m.height / 2 - f.top]; });
      let d = `M${pts[0][0]},${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], dy = (y1 - y0) * .55;
        d += ` C${x0},${y0 + dy} ${x1},${y1 - dy} ${x1},${y1}`;
      }
      base.setAttribute('d', d); lit.setAttribute('d', d);
      len = lit.getTotalLength();
      lit.style.strokeDasharray = `${len} ${len}`;
      grad.setAttribute('y2', f.height);
      grad.innerHTML = vis.map((r, k) => `<stop offset="${(pts[k][1] / f.height).toFixed(4)}" stop-color="${r.style.getPropertyValue('--accent')}"/>`).join('');
      onScroll();
    }

    // Scroll-linked: the lit stream and its glowing head follow the reader down the page.
    function onScroll() {
      if (!len) return;
      const f = flow.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (innerHeight * .62 - f.top) / f.height));
      const at = reduced ? len : len * t;
      lit.style.strokeDashoffset = String(len - at);
      const pt = lit.getPointAtLength(at);
      headDot.setAttribute('cx', pt.x); headDot.setAttribute('cy', pt.y);
      headDot.style.opacity = at > 0 && at < len ? 1 : 0;
    }

    // Rows light up as they enter view (CSS transitions; no GSAP needed).
    if (reduced || !('IntersectionObserver' in window)) rows.forEach(r => r.classList.add('is-in'));
    else {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
      rows.forEach(r => io.observe(r));
    }

    layout();
    let raf = 0;
    const queue = fn => () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fn(); }); };
    addEventListener('scroll', queue(onScroll), { passive: true });
    addEventListener('resize', queue(drawPath));
    list.addEventListener('load', queue(drawPath), true); // lazy images can change nothing in size, but fonts/images settle layout
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawPath);
    drawPath();
    setTimeout(drawPath, 800);

    el.querySelector('.filters').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      state[b.dataset.k] = b.dataset.v || null;
      b.parentElement.querySelectorAll('.chip').forEach(c => { c.classList.toggle('is-active', c === b); c.setAttribute('aria-pressed', String(c === b)); });
      let shown = 0;
      rows.forEach((r, i) => { const ok = L.matchesFilters(platforms[i], state); r.style.display = ok ? '' : 'none'; if (ok) r.classList.add('is-in'); shown += ok; });
      el.querySelector('.flow__empty').hidden = shown > 0;
      layout(); drawPath(); refreshSoon();
    });
  }

  // ---------- academic ----------
  function renderAcademic() {
    const A = DATA.academic;
    const el = document.getElementById('academic');
    if (!A) { hideSection(el, 'academic'); return; }
    const areas = A.areas || [], sup = A.supervision || [];
    const pubs = A.publications || [], teaching = A.teaching || [];

    // Research-area graph: nodes on an ellipse, links to a central hub.
    const W = 640, H = 360, cx = W / 2, cy = H / 2;
    const pos = areas.map((a, i) => {
      const ang = (i / areas.length) * Math.PI * 2 - Math.PI / 2;
      return { ...a, x: cx + Math.cos(ang) * 250, y: cy + Math.sin(ang) * 135, n: sup.filter(s => (s.areas || []).includes(a.id)).length };
    });
    const graph = areas.length ? `
      <svg class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Research areas">
        ${pos.map(p => `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" class="graph__link"/>`).join('')}
        <circle cx="${cx}" cy="${cy}" r="30" class="graph__hub"/><text x="${cx}" y="${cy + 4}" class="graph__hubtext">AI</text>
        ${pos.map(p => `<g class="graph__node" tabindex="0" data-area="${esc(p.id)}">
          <circle cx="${p.x}" cy="${p.y}" r="${10 + p.n * 3}"/>
          <text x="${p.x}" y="${p.y + (p.y < cy ? -20 - p.n * 3 : 26 + p.n * 3)}">${esc(p.label)}</text></g>`).join('')}
      </svg>` : '';

    const isCo = s => s.role === 'Co-supervisor';
    const supCard = list => list.map(s => `
      <article class="scard reveal${isCo(s) ? ' scard--co' : ''}" data-areas="${esc((s.areas || []).join(' '))}">
        <p class="scard__meta"><span>${esc(s.level)} · ${esc(isCo(s) ? 'Co-supervisor' : 'Main supervisor')}</span><span class="scard__status">${esc(s.status)}</span></p>
        ${s.title ? `<h4>${esc(s.title)}</h4>` : '<h4 class="scard__tbc">Thesis title to follow</h4>'}</article>`).join('');
    // Headline: main-supervised students first, co-supervised as a second line; counts come from the list.
    const roleBox = (label, list) => list.length ? `<div class="suphead"><div class="suphead__blk">
        <p class="suphead__role">${label}</p>
        <p class="suphead__big"><b>${list.length}</b> ${list.length === 1 ? 'student' : 'students'}</p>
        <p class="suphead__split">${L.countBy(list, 'level').slice().reverse().map(([lvl, n]) => `<span><b>${n}</b> ${esc(lvl)}</span>`).join('')}</p>
      </div></div>` : '';
    const areaChips = areas.length ? `<div class="area-chips">${areas.map(a => `<button class="chip area-chip" data-area="${esc(a.id)}" aria-pressed="false">${esc(a.label)}</button>`).join('')}</div>` : '';

    // Five glass slabs (numbered, stepped stack); each opens a pane in the panel beside it.
    const edu = (DATA.career && DATA.career.education) || [];
    const phd = edu.find(e => /philosophy|phd/i.test(e.qualification)) || edu[0];
    const main = sup.filter(s => !isCo(s)), co = sup.filter(isCo);
    const lvl = list => L.countBy(list, 'level').slice().reverse().map(([l, n]) => `${n} ${l}`).join(' · ');
    const rec = A.recognition;
    const ICON = {
      cap: '<path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/><path d="M22 10v6"/>',
      net: '<circle cx="12" cy="12" r="2.5"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/><path d="M6 7l4 3M14 10l4-3M6 17l4-3M14 14l4 3"/>',
      people: '<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M15 20c0-2.6 1.6-4.6 4-5 1.2.3 2 1.4 2 3.5"/>',
      book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/>',
      shield: '<path d="M12 2l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
      quill: '<path d="M4 20c6-1 10-4 13-10l3-7-7 3C7 9 5 13 4 20z"/><path d="M4 20l6-6"/>',
    };
    const slabs = [
      phd && { id: 'edu', icon: 'cap', title: 'Doctorate', stat: '', sub: `${phd.qualification} · ${phd.institution}, ${phd.year}` },
      areas.length && { id: 'areas', icon: 'net', title: 'Research areas', stat: areas.length, sub: areas.slice(0, 4).map(x => x.label).join(', ') + (areas.length > 4 ? '…' : '') },
      main.length && { id: 'sup', icon: 'people', title: 'Postgraduate supervision', stat: main.length, sub: `Main supervisor · ${lvl(main)} · ongoing AI-integrated theses` },
      co.length && { id: 'co', icon: 'book', title: 'Co-supervision', stat: co.length, sub: `Co-supervisor · ${lvl(co)} · cross-faculty research` },
      rec && { id: 'rec', icon: 'shield', title: 'Academic recognition', stat: '', sub: `${rec.title} · ${rec.issuer}` },
      pubs.length && { id: 'pubs', icon: 'quill', title: 'Publications', stat: pubs.length,
        sub: `${L.countBy(pubs, 'type').map(([t, n]) => `${n} ${t.toLowerCase()}`).join(' · ')} · ${Math.min(...pubs.map(p => p.year))}–${Math.max(...pubs.map(p => p.year))}` },
    ].filter(Boolean);
    const slabHTML = slabs.map((d, i) => `
      <li class="slab-wrap" style="--i:${i}">
        <button class="slab${i === 0 ? ' is-active' : ''}" type="button" data-pane="${d.id}" aria-expanded="${i === 0}" aria-controls="pane-${d.id}">
          <span class="slab__num" aria-hidden="true">${i + 1}</span>
          <svg class="slab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[d.icon]}</svg>
          <span class="slab__body">
            <span class="slab__title">${d.stat !== '' ? `<b class="slab__stat" data-count="${d.stat}">${d.stat}</b> ` : ''}${esc(d.title)}</span>
            <span class="slab__sub">${esc(d.sub)}</span>
          </span>
        </button>
      </li>`).join('');
    const pane = (id, title, body) => `<section class="pane" id="pane-${id}" data-pane="${id}"${id === slabs[0].id ? '' : ' hidden'}><h3 class="pane__title">${esc(title)}</h3>${body}</section>`;
    const panes = [
      phd && pane('edu', 'Education', `<ol class="edu">${edu.map(e => `<li class="edu__row"><span class="edu__year">${esc(e.year)}</span><div><p class="edu__q">${esc(e.qualification)}</p><p class="muted small">${[e.institution, e.focus].filter(Boolean).map(esc).join(' · ')}</p></div></li>`).join('')}</ol>` +
        (teaching.length ? `<h4 class="pane__sub">Courses taught</h4><ul class="courses">${teaching.map(c => `<li><b>${esc(c.code)}</b><span>${esc(c.title)}</span></li>`).join('')}</ul>` : '')),
      areas.length && pane('areas', 'Research areas', `<div class="acad__graph">${graph}<p class="muted small">Node size = number of supervised theses in that area.</p></div>`),
      main.length && pane('sup', 'Postgraduate supervision', `${roleBox('Main supervisor', main)}${areaChips}<div class="scards">${supCard(main)}</div>`),
      co.length && pane('co', 'Co-supervision', `${roleBox('Co-supervisor', co)}<div class="scards">${supCard(co)}</div>`),
      rec && pane('rec', 'Academic recognition', `<p class="rec__title">${esc(rec.title)} <span class="muted">· ${esc(rec.issuer)}</span></p><p class="rec__text">${esc(rec.text)}</p>`),
      pubs.length && pane('pubs', 'Publications', L.countBy(pubs, 'type').slice().reverse().map(([type, n]) => `
        <h4 class="pane__sub">${esc(type)} <span class="muted">(${n})</span></h4>
        <ol class="pubs">${pubs.filter(p => p.type === type).sort((a, b) => b.year - a.year).map(p => `
          <li class="pub"><span class="pub__year">${esc(p.year)}</span><div>
            <p class="pub__t">${esc(p.title)}</p>
            <p class="muted small">${[p.authors, p.venue].filter(Boolean).map(esc).join(' · ')}</p>
          </div></li>`).join('')}</ol>`).join('')),
    ].filter(Boolean).join('');
    const shards = Array.from({ length: 9 }, (_, i) => `<i class="shard" style="--s:${i};left:${(i * 37) % 96}%;top:${(i * 53 + 11) % 90}%;transform:scale(${(.55 + ((i * 29) % 7) / 10).toFixed(2)})"></i>`).join('');

    el.innerHTML = head('academic', 'Academic', 'Research that feeds real systems') +
      `<div class="acad2">
        <div class="stack"><div class="stack__shards" aria-hidden="true">${shards}</div><ol class="slabs">${slabHTML}</ol></div>
        <div class="acad__panel glass">${panes}</div>
      </div>`;

    // Slab -> pane switching, entrance when scrolled into view, stat count-up.
    const slabEls = [...el.querySelectorAll('.slab')], paneEls = [...el.querySelectorAll('.pane')];
    const show = id => {
      slabEls.forEach(b => { const on = b.dataset.pane === id; b.classList.toggle('is-active', on); b.setAttribute('aria-expanded', String(on)); });
      paneEls.forEach(pn => { const on = pn.dataset.pane === id; if (on && pn.hidden) { pn.hidden = false; pn.classList.remove('is-show'); requestAnimationFrame(() => pn.classList.add('is-show')); } else if (!on) { pn.hidden = true; pn.classList.remove('is-show'); } });
      refreshSoon();
    };
    paneEls[0] && paneEls[0].classList.add('is-show');
    const panel = el.querySelector('.acad__panel');
    slabEls.forEach(b => b.addEventListener('click', () => {
      show(b.dataset.pane);
      if (matchMedia('(max-width: 960px)').matches) panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); // stacked layout: bring the pane up
    }));
    const stack = el.querySelector('.stack');
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting) return; io.disconnect();
      stack.classList.add('is-in');
      if (reduced) return;
      el.querySelectorAll('.slab__stat').forEach((n, i) => {
        const to = +n.dataset.count, t0 = performance.now() + 500 + i * 140;
        (function tick(now) { const k = Math.min(1, Math.max(0, (now - t0) / 900)); n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); })(t0);
      });
    }, { threshold: .25 }).observe(stack);

    const cards = [...el.querySelectorAll('.scard')];
    const highlight = id => cards.forEach(c => c.classList.toggle('is-dim', !!id && !c.dataset.areas.split(' ').includes(id)));
    el.querySelectorAll('.graph__node').forEach(n => {
      ['mouseenter', 'focus'].forEach(ev => n.addEventListener(ev, () => highlight(n.dataset.area)));
      ['mouseleave', 'blur'].forEach(ev => n.addEventListener(ev, () => highlight(null)));
    });

    let activeArea = null;
    const areaChipEls = [...el.querySelectorAll('.area-chip')];
    const setActiveArea = id => {
      activeArea = id;
      areaChipEls.forEach(c => { c.classList.toggle('is-active', c.dataset.area === id); c.setAttribute('aria-pressed', String(c.dataset.area === id)); });
      highlight(id);
    };
    areaChipEls.forEach(c => {
      c.addEventListener('click', () => setActiveArea(activeArea === c.dataset.area ? null : c.dataset.area));
      ['mouseenter', 'focus'].forEach(ev => c.addEventListener(ev, () => highlight(c.dataset.area)));
      ['mouseleave', 'blur'].forEach(ev => c.addEventListener(ev, () => highlight(activeArea)));
    });

  }

  // ---------- credentials: cards orbiting the bobblehead ----------
  // Each card runs a closed ellipse around the subject. cx/cy is the centre of its ring and rx/ry
  // its radii, all as % of the stage; `t` is seconds for one full revolution and `phase` where on
  // the ring it starts (0-1). Three rings at different heights keep the whole frame busy.
  const ORBIT = [
    { cx: 50, cy: 23, rx: 35, ry: 9, t: 27, phase: 0.02, w: 25 },
    { cx: 50, cy: 23, rx: 35, ry: 9, t: 27, phase: 0.40, w: 25 },
    { cx: 50, cy: 25, rx: 33, ry: 8, t: 31, phase: 0.72, w: 24 },
    { cx: 50, cy: 50, rx: 38, ry: 13, t: 23, phase: 0.10, w: 27 },
    { cx: 50, cy: 50, rx: 38, ry: 13, t: 23, phase: 0.36, w: 27 },
    { cx: 50, cy: 50, rx: 38, ry: 13, t: 23, phase: 0.62, w: 27 },
    { cx: 50, cy: 52, rx: 36, ry: 12, t: 29, phase: 0.86, w: 26 },
    { cx: 50, cy: 76, rx: 32, ry: 8, t: 25, phase: 0.22, w: 26 },
    { cx: 50, cy: 76, rx: 32, ry: 8, t: 25, phase: 0.55, w: 26 },
    { cx: 50, cy: 78, rx: 30, ry: 7, t: 33, phase: 0.88, w: 24 },
  ];
  // Square sector renders double as the cards' album art, like the thumbnails in the reference.
  const ART = ['energy', 'enterprise', 'education', 'government', 'hr', 'legal', 'tourism', 'logistics', 'infrastructure'];
  // Loose widgets, on their own small rings.
  const MOTES = [
    { cls: 'eq', cx: 50, cy: 14, rx: 22, ry: 5, t: 19, phase: 0.55 },
    { cls: 'wave', cx: 50, cy: 40, rx: 27, ry: 9, t: 21, phase: 0.25 },
    { cls: 'eq', cx: 50, cy: 64, rx: 24, ry: 7, t: 17, phase: 0.80 },
    { cls: 'wave', cx: 50, cy: 88, rx: 20, ry: 5, t: 23, phase: 0.05 },
  ];
  function renderCredentials() {
    const C = DATA.credentials;
    const el = document.getElementById('credentials');
    if (!C) { hideSection(el, 'credentials'); return; }
    // Certified: the dated trainer/TVET credentials (ELITE@UM lives in Academic).
    // Invited, on stage: a few dated talks, so the stage carries both halves of the section.
    const certs = (C.credentials || []).filter(c => c.year);
    // talk titles are sentences; cut them at the first natural break and cap them to card width
    const trim = (v, n) => {
      const head = String(v).split(/ [—-]+ |: /)[0].replace(/^["“]|["”]$/g, '').trim();
      return head.length > n ? head.slice(0, n - 1).replace(/[ ,]+$/, '') + '…' : head;
    };
    // "Malaysia Digital Economy Corporation (MDEC)" -> "MDEC": card subtitles have no room for the long form
    const shortOrg = v => (String(v).match(/\(([^)]{2,12})\)/) || [])[1] || trim(v, 26);
    const guest = (C.talks || []).filter(t => t.org && L.parseDate(t.date)).slice(0, ORBIT.length - certs.length)
      .map(t => ({ short: trim(t.title, 25), org: shortOrg(t.org), icon: 'mic', year: String(t.date).slice(0, 4), kind: 'talk' }));
    const creds = [...certs, ...guest].slice(0, ORBIT.length);
    const ICON = {
      mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
      cart: '<path d="M3 4h2l2.4 11h10.2L20 7H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/>',
      megaphone: '<path d="M3 10v4h3l7 4V6l-7 4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
      tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.1-2.1z"/>',
      diploma: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M7 9h10M7 12h6"/><circle cx="16" cy="15" r="2"/><path d="M15 17l-1 4 2-1 2 1-1-4"/>',
      shield: '<path d="M12 2l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    };
    const HUES = ['#3b82f6', '#22d3ee', '#19e39b', '#a855f7', '#f59e0b', '#ec4899', '#22d3ee', '#19e39b', '#a855f7', '#3b82f6'];
    const svgIcon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k] || ICON.shield}</svg>`;
    const E = C.engine || { label: 'Training Engine', stat: '', caption: '' };
    const cap = c => c.code && c.code.length <= 12 ? `Cert. ${c.code}` : 'Certified';
    const at = (x, y) => `left:${x}%;top:${y}%`;

    // Talks & trainings: newest dated first, undated ones after (L.splitByDate), grouped by year.
    const talks = C.talks || [];
    const { upcoming, past } = L.splitByDate(talks); // dates order the list; they are not shown
    const talkLI = t => `<li class="talk">
      <p class="talk__t">${esc(t.title)}</p>
      ${[t.org, t.place, t.audience].some(Boolean) ? `<p class="muted small">${[t.org, t.place, t.audience].filter(Boolean).map(esc).join(' · ')}</p>` : ''}
      </li>`;
    // Training catalogue: what he can be booked to deliver. Each card opens its syllabus.
    const T = DATA.training || {}, progs = T.programmes || [];
    const detail = (label, items) => items && items.length
      ? `<h5>${esc(label)}</h5><ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
    const catalogueHTML = progs.length ? `
      <div class="cat">
        <div class="talks__head">
          <h3>Training programmes</h3>
          <p class="muted small"><b>${progs.length}</b> ready-to-run programmes${T.audience && T.audience.length ? ` · ${T.audience.length} audience types` : ''} · typically ${esc(progs[0].pax || '20 - 30')} participants</p>
        </div>
        <ul class="cat__grid">${progs.map((p, i) => `
          <li class="cat__item">
            <details class="cat__card"${i < 0 ? ' open' : ''}>
              <summary>
                <b>${esc(p.name)}</b>
                <span class="muted small">${p.topics.length} topics${p.pax ? ` · ${esc(p.pax)} pax` : ''}</span>
              </summary>
              <div class="cat__body">${detail('Topics covered', p.topics)}${detail('Outcomes', p.objectives)}</div>
            </details>
          </li>`).join('')}</ul>
        ${T.audience && T.audience.length ? `<p class="cat__aud muted small"><b>Who it is for:</b> ${T.audience.map(esc).join(' · ')}</p>` : ''}
      </div>` : '';

    const LEAD = 10;
    const ordered = [...upcoming, ...past];
    const talksHTML = talks.length ? `
      <div class="talks">
        <div class="talks__head">
          <h3>Talks &amp; trainings</h3>
          <p class="muted small"><b>${E.stat || talks.length}</b> delivered · ${talks.length} on record here</p>
        </div>
        <ol class="talks__list">${ordered.slice(0, LEAD).map(talkLI).join('')}</ol>
        <ol class="talks__list talks__list--more" hidden>${ordered.slice(LEAD).map(talkLI).join('')}</ol>
        ${ordered.length > LEAD ? `<button class="btn btn--ghost talks__more" type="button" aria-expanded="false">Show all ${ordered.length}</button>` : ''}
      </div>` : '';

    const bars = (n, seed) => Array.from({ length: n }, (_, i) =>
      `<i style="--h:${28 + ((seed * 7 + i * 31) % 64)}%;--i:${i}"></i>`).join('');
    const GLYPH = {
      prev: '<path d="M18 5v14L8 12zM6 5v14"/>',
      next: '<path d="M6 5v14l10-7zM18 5v14"/>',
      play: '<path d="M8 5.5v13l11-6.5z"/>',
    };
    const glyph = (k, cls) => `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${GLYPH[k]}</svg>`;

    // One orbiting player card. JS sets its transform, z-index and opacity every frame.
    const card = (c, i) => {
      const o = ORBIT[i];
      const deck = i % 3 === 2
        ? `<span class="ocard__track"><i style="--p:${40 + i * 6}%"></i></span>`
        : i % 2 === 0
          ? `<div class="ocard__deck">${glyph('prev', 'ocard__skip')}<span class="ocard__play">${glyph('play', '')}</span>${glyph('next', 'ocard__skip')}<span class="ocard__year">${esc(c.year)}</span></div>
             <span class="ocard__track"><i style="--p:${48 + i * 5}%"></i></span>`
          : `<div class="ocard__deck ocard__deck--wave"><span class="ocard__play ocard__play--sm">${glyph('play', '')}</span><span class="ocard__wave">${bars(20, i + 3)}</span><span class="ocard__year">${esc(c.year)}</span></div>`;
      return `<div class="ocard" style="--w:${o.w};--hue:${HUES[i % HUES.length]};--i:${i}">
        <article class="ocard__card">
          <div class="ocard__top">
            <span class="ocard__art"><img src="media/sectors/${ART[i % ART.length]}.jpg" alt="" width="480" height="480" decoding="async"></span>
            <span class="ocard__meta">
              <b class="ocard__title">${esc(c.short || c.title)}</b>
              <span class="ocard__sub">${esc(c.org || c.issuer)}</span>
            </span>
            <span class="ocard__badge" title="${esc(c.kind === 'talk' ? 'Invited' : cap(c))}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
            </span>
          </div>
          ${deck}
        </article>
      </div>`;
    };

    const motes = MOTES.map((m, i) => `<span class="mote mote--${m.cls}" style="--i:${i}" aria-hidden="true">${m.cls === 'eq' ? bars(7, i + 1) : bars(24, i + 9)}</span>`).join('');

    const list = certs.map((c, i) => `
      <li class="cl" style="--hue:${HUES[i % HUES.length]}"><span class="cl__icon">${svgIcon(c.icon)}</span>
        <div><b>${esc(c.short || c.title)}</b><span class="muted small">${esc(c.org || c.issuer)} · ${esc(cap(c))}</span></div><b class="cl__year">${esc(c.year)}</b></li>`).join('');

    el.innerHTML = head('credentials', 'Credentials & Talks', 'Certified, invited, on stage') +
      `<div class="orbit">
        <div class="orbit__glow" aria-hidden="true"></div>
        <div class="orbit__space">
          <span class="orbit__spot" aria-hidden="true"></span>
          <img class="orbit__figure" src="media/figure-trim.png" alt="" width="478" height="672" loading="lazy" decoding="async">
          ${creds.map(card).join('')}
          ${motes}
        </div>
        <p class="orbit__cap"><b>${esc(E.stat)}</b> ${esc(E.caption)} · ${(C.feeders || []).map(f => esc(f.label)).join(' · ')}</p>
      </div>
      <ol class="cred-list">${list}</ol>
      ${catalogueHTML}
      ${talksHTML}`;

    const orbit = el.querySelector('.orbit'), space = el.querySelector('.orbit__space');
    const nodes = [...el.querySelectorAll('.ocard')], moteEls = [...el.querySelectorAll('.mote')];
    const rings = [...ORBIT, ...MOTES];
    const all = [...nodes, ...moteEls];
    let px = 0, py = 0; // pointer parallax, -1..1

    // Places every card for a given time. Exposed on the element so it can be driven to an exact
    // moment when checking the motion, instead of sampling wall-clock and hoping the tab renders.
    function place(ms) {
      const W = space.clientWidth, H = space.clientHeight;
      if (!W) return;
      all.forEach((n, i) => {
        const o = rings[i];
        const ang = ((ms / 1000 / o.t) + o.phase) * Math.PI * 2;
        const x = (o.cx / 100) * W + Math.cos(ang) * (o.rx / 100) * W;
        const y = (o.cy / 100) * H + Math.sin(ang) * (o.ry / 100) * H;
        // sin = +1 at the near side of the ring, -1 at the far side behind the subject
        const near = (Math.sin(ang) + 1) / 2;
        const scale = 0.74 + near * 0.34;
        const tilt = -Math.cos(ang) * 16;
        n.style.transform = `translate3d(${(x - n.offsetWidth / 2 + px * 14 * near).toFixed(1)}px, ${(y - n.offsetHeight / 2 + py * 11 * near).toFixed(1)}px, 0) rotateY(${tilt.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        n.style.zIndex = near > 0.5 ? 6 : 1;          // in front of the figure, or behind it
        n.style.opacity = (0.55 + near * 0.45).toFixed(2);
      });
    }
    orbit.__place = place;
    window.__ORBIT_RINGS = rings; // ring geometry, for checking the paths

    let raf = 0;
    const loop = t => { place(t); raf = requestAnimationFrame(loop); };
    if (reduced) place(0); else raf = requestAnimationFrame(loop);
    addEventListener('resize', () => place(performance.now()), { passive: true });
    // stop the loop while the section is off-screen
    new IntersectionObserver(([e]) => {
      if (reduced) return;
      if (e.isIntersecting && !raf) raf = requestAnimationFrame(loop);
      else if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0 }).observe(orbit);

    if (!reduced && matchMedia('(hover: hover)').matches) {
      orbit.addEventListener('pointermove', ev => {
        const r = orbit.getBoundingClientRect();
        px = (ev.clientX - r.left) / r.width * 2 - 1;
        py = (ev.clientY - r.top) / r.height * 2 - 1;
      });
      orbit.addEventListener('pointerleave', () => { px = 0; py = 0; });
    }

    const more = el.querySelector('.talks__more'), rest = el.querySelector('.talks__list--more');
    more && more.addEventListener('click', () => {
      const open = rest.hidden;
      rest.hidden = !open;
      more.setAttribute('aria-expanded', String(open));
      more.textContent = open ? 'Show fewer' : `Show all ${ordered.length}`;
      if (!open) el.querySelector('.talks').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      refreshSoon();
    });
  }

  // ---------- contact ----------
  const telHref = phone => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) return '+6' + digits;
    if (digits.startsWith('60')) return '+' + digits;
    return '+' + digits;
  };

  function renderContact() {
    const P = DATA.profile || {}, c = P.contact || {};
    const el = document.getElementById('contact');
    el.innerHTML = `<div class="contact glass glass--live">
      <p class="eyebrow">Contact</p><h2 id="contact-h">Let’s build what’s next.</h2>
      <ul class="contact__list">
        ${c.email ? `<li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>` : ''}
        ${c.phone ? `<li><a href="tel:${esc(telHref(c.phone))}">Tel ${esc(c.phone)}</a></li>` : ''}
        ${c.linkedin && /^https:\/\//i.test(c.linkedin) ? `<li><a href="${esc(c.linkedin)}" rel="noopener" target="_blank">LinkedIn</a></li>` : ''}
      </ul>
      ${P.cv ? `<a class="btn btn--primary" href="${esc(P.cv)}" download>Download Profile</a>` : ''}
    </div><p class="footer__note muted small">© ${new Date().getFullYear()} ${esc(P.name || '')}</p>`;
  }

  const RENDERERS = [renderNav, renderCareer, renderProjects, renderAcademic, renderCredentials, renderContact];
  RENDERERS.forEach(fn => {
    try { fn(); } catch (err) { console.warn(`[dashboard] ${fn.name} failed`, err); }
  });
  document.querySelectorAll('.section').forEach(reveal);

  // Deep links (#career, #projects, ...): sections are rendered by JS and ScrollTrigger re-measures
  // afterwards, so the browser's own hash jump lands on stale positions. Re-apply it once things settle.
  let lenis = null;
  const NAV_GAP = 16; // the floating nav sits 12px from the top
  // #projects/p/<slug> -> platform row, #projects/t/<slug> -> tool group; unknown slugs fall back to the section.
  function hashTarget() {
    const raw = decodeURIComponent((location.hash || '').slice(1));
    const m = raw.match(/^projects\/(p|t)\/(.+)$/);
    if (!m) return { el: raw && document.getElementById(raw), hit: null };
    const item = document.getElementById(`${m[1]}-${m[2]}`);
    return { el: item || document.getElementById('projects'), hit: item };
  }
  let hitTimer = 0;
  function gotoHash(smooth) {
    const { el, hit } = hashTarget();
    if (!el || el.hidden) return;
    if (hit) { // light the exact item up for a moment
      hit.classList.add('is-in', 'is-hit');
      clearTimeout(hitTimer); hitTimer = setTimeout(() => hit.classList.remove('is-hit'), 3000);
    }
    if (lenis) { lenis.scrollTo(el, { offset: -NAV_GAP, immediate: !smooth }); return; }
    const y = el.getBoundingClientRect().top + window.scrollY - NAV_GAP;
    window.scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' });
  }
  if (location.hash) {
    const settle = () => { gotoHash(false); [400, 1200, 2400].forEach(ms => setTimeout(() => gotoHash(false), ms)); };
    document.readyState === 'complete' ? settle() : addEventListener('load', settle);
  }
  addEventListener('hashchange', () => gotoHash(true));

  if (!reduced && window.Lenis && hasGsap) {
    lenis = new Lenis({ lerp: .1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    // Lenis drives scrolling itself; CSS `scroll-behavior: smooth` would fight it on anchor jumps.
    document.documentElement.style.scrollBehavior = 'auto';
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a || !a.hash) return;
      let target = null; try { target = document.querySelector(a.hash); } catch (_) { /* deep-link hash, let hashchange handle it */ }
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -NAV_GAP });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }
})();
