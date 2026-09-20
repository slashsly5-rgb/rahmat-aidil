// site/resume/resume.js — digital-resume poster: floating gold glass panels around the seated figure.
// Every panel is a link into the main site. Data comes from ../data/*.js (nothing duplicated here).
(function () {
  const { esc, countBy } = window.LIB;
  const D = window.DATA || {};
  const P = D.profile, ui = document.getElementById('ui');
  if (!P || !ui) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SITE = '../', FB = 'https://www.facebook.com/aidjudigital';
  const AV = 'avatar.png?v=10'; // bump with index.html when the avatar is re-cropped, so caches refetch
  // WhatsApp deep link: Malaysian local number -> international, no punctuation (016-772 5496 -> 60167725496)
  const waNumber = p => { const d = String(p || '').replace(/\D/g, ''); return d.startsWith('0') ? '6' + d : d; };
  const HELLO = "Hi Dr. Rahmat, I saw your digital resume and would like to talk about a talk / training / AI project.";
  const waHref = p => `https://wa.me/${waNumber(p)}?text=${encodeURIComponent(HELLO)}`;
  const mailHref = e => `mailto:${e}?subject=${encodeURIComponent('Enquiry from your digital resume')}&body=${encodeURIComponent(HELLO)}`;
  const platforms = (D.projects && D.projects.platforms) || [], tools = (D.projects && D.projects.tools) || [];
  const sup = (D.academic && D.academic.supervision) || [], jobs = (D.career && D.career.jobs) || [];
  const creds = ((D.credentials && D.credentials.credentials) || []).filter(c => c.year);
  const talks = (P.stats || []).find(s => /talks/i.test(s.label)); // '500+'
  const talksStat = talks ? talks.value : '500+';
  const main = sup.filter(s => s.role !== 'Co-supervisor').length, co = sup.length - main;
  const now = (P.now || [])[0];
  const c = P.contact || {};

  // Panel positions as % of the 4:5 poster (x = left edge, y = top edge, w = width). Tune here if the scene changes.
  const POS = {
    profile: { x: 3, y: 2.5, w: 60 },   dash: { x: 66, y: 4, w: 31 },       insights: { x: 66, y: 19.5, w: 31 },
    recog: { x: 66, y: 34.5, w: 31 },    trend: { x: 66, y: 45.5, w: 31 },   reacts: { x: 66, y: 56, w: 31 },
    collab: { x: 66, y: 62, w: 31 },     fb: { x: 83, y: 74, w: 12 },        follower: { x: 3, y: 45, w: 24 },
    thumbs: { x: 3, y: 56, w: 30 },      msg: { x: 3, y: 68, w: 24 },         growth: { x: 3, y: 74.5, w: 27 },
  };
  const at = k => `left:${POS[k].x}%;top:${POS[k].y}%;width:${POS[k].w}%`;
  const panel = (k, href, body, extra = '') => `<a class="p p--${k}${extra}" style="${at(k)}" href="${esc(href)}"${/^https?:/.test(href) ? ' rel="noopener" target="_blank"' : ''}>${body}</a>`;
  const seeAll = 'See all';
  const I = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
    save: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.4 2.2 3.2-.5 1 3.1 2.9 1.5-1.1 3 1.1 3-2.9 1.5-1 3.1-3.2-.5L12 22l-2.4-2.2-3.2.5-1-3.1-2.9-1.5 1.1-3-1.1-3 2.9-1.5 1-3.1 3.2.5z"/><path d="M8.5 12.2l2.3 2.3 4.7-4.9" fill="none" stroke="#1a1204" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M12 3v11"/><path d="M8 11l4 4 4-4"/><path d="M4 19h16"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.2-.4-4.5-1.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.2.1-.2 0-.4 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3A2.9 2.9 0 0 0 6.7 12a5 5 0 0 0 1 2.2 11.4 11.4 0 0 0 4.4 3.9c1.6.6 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2z"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
  };

  // ---- profile card
  // ELITE@UM first, and each role chip links to the section that backs it
  const roles = [...(P.roles || [])].sort((a, b) => (/elite/i.test(b) ? 1 : 0) - (/elite/i.test(a) ? 1 : 0));
  const ROLE_LINK = [[/elite/i, '#academic'], [/advisor|blackstone/i, '#projects']];
  const roleHref = r => SITE + ((ROLE_LINK.find(([re]) => re.test(r)) || [, '#career'])[1]);
  const bio = [
    ['\u{1F916}', 'AI systems builder \u00b7 platforms, agents, RAG'],
    ['\u{1F3A4}', 'HRDF &amp; DKM certified trainer'],
    ['\u{1F7E2}', 'Available for talks, trainings &amp; AI advisory'],
    c.email && ['\u2709\uFE0F', esc(c.email)],
    ['\u{1F517}', esc(FB.replace('https://www.', ''))],
  ].filter(Boolean);
  const profile = `<div class="p p--profile" style="${at('profile')}">
    <span class="p__top">
      <span class="p__brand">${I.fb}<b>facebook</b></span>
      ${P.cv ? `<a class="b b--gold b--dl" href="${SITE}${esc(P.cv)}" download>${I.dl}Download Profile</a>` : ''}
    </span>
    <span class="prof">
      <span class="prof__avatar"><img src="${AV}" alt=""></span>
      <span class="prof__id">
        <b class="prof__handle">aidjudigital <i class="v" aria-label="verified">${I.check}</i></b>
        <span class="prof__name">${esc(P.name)}</span>
        <span class="prof__role">${esc(P.title || '')}</span>
      </span>
    </span>
    <span class="prof__stats">
      <span><b>${platforms.length}</b><em>AI platforms</em></span>
      <span><b>${esc(talksStat)}</b><em>talks &amp; trainings</em></span>
      <span><b>${sup.length}</b><em>postgrad students</em></span>
    </span>
    <span class="prof__chips">${roles.map(r => `<a class="rchip" href="${roleHref(r)}">${esc(r)}</a>`).join('')}</span>
    <span class="prof__bio">${bio.map(([ic, t]) => `<span class="brow"><i>${ic}</i>${t}</span>`).join('')}</span>
    <span class="prof__btns">
      <a class="b b--gold" href="${SITE}">Visit site</a>
      ${c.phone ? `<a class="b b--wa" href="${waHref(c.phone)}" rel="noopener" target="_blank">${I.wa}Message</a>` : ''}
      ${c.email ? `<a class="b b--sq" href="${mailHref(c.email)}" aria-label="Email">${I.mail}</a>` : ''}
    </span></div>`;

  // ---- professional dashboard
  const dash = panel('dash', SITE + '#projects', `
    <span class="p__head">Professional dashboard<i>${seeAll}</i></span>
    <span class="tiles">
      <span class="tile"><small>AI platforms</small><b data-count="${platforms.length}">${platforms.length}</b><em>deployed</em></span>
      <span class="tile"><small>Agents &amp; tools</small><b data-count="${tools.length}">${tools.length}</b><em>custom built</em></span>
      <span class="tile"><small>Talks</small><b>${esc(talksStat)}</b><em>delivered</em></span>
    </span>`);

  // ---- audience insights: platforms by sector + supervision donut
  const sectors = countBy(platforms, 'sector').sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxS = Math.max(1, ...sectors.map(s => s[1]));
  const pctMain = sup.length ? Math.round(main / sup.length * 100) : 0;
  const insights = panel('insights', SITE + '#academic', `
    <span class="p__head">Audience insights<i>${seeAll}</i></span>
    <span class="ins">
      <span class="ins__bars"><small>Top sectors</small>${sectors.map(([s, n]) => `<span class="bar"><em>${esc(s)}</em><span class="bar__track"><span class="bar__fill" style="--w:${n / maxS * 100}%"></span></span><b>${Math.round(n / platforms.length * 100)}%</b></span>`).join('')}</span>
      <span class="ins__donut"><small>Supervision</small><span class="donut" style="--p:${pctMain}"></span><span class="donut__legend"><span><b>${pctMain}%</b>main</span><span><b>${100 - pctMain}%</b>co</span></span></span>
    </span>`);

  // ---- content performance -> recognition
  const recog = panel('recog', SITE + '#credentials', `
    <span class="p__head">Content performance<i>${seeAll}</i></span>
    <span class="tiles tiles--3">
      <span class="tile"><small>Expert</small><b>ELITE@UM</b><em>Universiti Malaya</em></span>
      <span class="tile"><small>TVET</small><b>DKM L4</b><em>Pengajaran TVET</em></span>
      <span class="tile"><small>Trainer</small><b>HRDF</b><em>certified</em></span>
    </span>`);

  // ---- trending -> now
  const trend = panel('trend', SITE + '#credentials', `
    <span class="p__head">This is trending! 🔥</span>
    <span class="trend"><span><small>Now</small><b>${esc(now ? now.text : 'Open for engagements')}</b>${now && now.until ? `<em>until ${esc(now.until)}</em>` : ''}</span>
    <svg class="trend__line" viewBox="0 0 80 40"><path d="M2 34 L18 26 L32 30 L48 16 L62 20 L78 6"/><path d="M66 6h12v12" class="trend__arrow"/></svg></span>`);

  // ---- reactions
  const reacts = panel('reacts', SITE + '#credentials', `
    <span class="reacts"><span>${I.heart}<b>${esc(talksStat)}</b></span><span>${I.chat}<b>${creds.length}</b> certs</span><span>${I.save}<b>${sup.length}</b></span></span>`, ' p--bare');

  // ---- collaboration request
  const collab = `<span class="p p--collab" style="${at('collab')}">
    <span class="row"><span class="dot"></span><span><small>Collaboration request</small><b>from your organisation</b></span></span>
    <span class="prof__btns">${c.phone ? `<a class="b b--wa" href="${waHref(c.phone)}" rel="noopener" target="_blank">${I.wa}WhatsApp</a>` : ''}${c.email ? `<a class="b" href="${mailHref(c.email)}">Email</a>` : ''}${c.linkedin ? `<a class="b" href="${esc(c.linkedin)}" rel="noopener" target="_blank">LinkedIn</a>` : ''}</span></span>`;

  // ---- facebook badge
  const fb = panel('fb', FB, `<span class="fbbadge">${I.fb}</span>`, ' p--bare');

  // ---- new follower -> new role
  const latest = jobs.slice().sort((a, b) => String(b.start).localeCompare(String(a.start)))[0];
  const follower = panel('follower', SITE + '#career', `
    <span class="row"><span class="prof__avatar prof__avatar--s"><img src="${AV}" alt=""></span><span><small>New role</small><b>${esc(latest ? latest.title : '')}</b><em>${esc(latest ? `${latest.org} · since ${latest.start}` : '')}</em></span></span>
    <span class="b b--gold b--xs">View career</span>`);

  // ---- portfolio thumbnails
  const pick = platforms.filter(p => p.status === 'Deployed').slice(0, 3);
  const thumbs = panel('thumbs', SITE + '#projects', `
    <span class="thumbs">${pick.map(p => `<span class="thumb" style="background-image:url('../media/sectors/${esc(String(p.sector || 'enterprise').toLowerCase())}.jpg')"><b>${esc(p.name)}</b><small>${esc(p.sector || '')}</small></span>`).join('')}</span>`, ' p--bare');

  // ---- new message
  const msg = panel('msg', c.phone ? waHref(c.phone) : (c.email ? mailHref(c.email) : SITE + '#contact'),
    `<span class="row">${c.phone ? I.wa : I.mail}<span><small>${c.phone ? 'WhatsApp me' : 'New message'}</small><b>Let's collaborate!</b></span></span>`);

  // ---- growth chart: cumulative roles per year
  const years = jobs.map(j => +String(j.start).slice(0, 4)).filter(Boolean).sort((a, b) => a - b);
  const y0 = years[0] || 2005, y1 = new Date().getFullYear();
  const pts = []; let acc = 0;
  for (let y = y0; y <= y1; y++) { acc += years.filter(v => v === y).length; pts.push([y, acc]); }
  const W = 160, H = 60, mx = Math.max(1, acc);
  const path = pts.map(([y, v], i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * (W - 8) + 4},${H - 8 - (v / mx) * (H - 16)}`).join(' ');
  const growth = panel('growth', SITE + '#career', `
    <span class="p__head">Career growth<i>${acc} roles</i></span>
    <svg class="growth" viewBox="0 0 ${W} ${H}"><path class="growth__area" d="${path} L${W - 4},${H - 4} L4,${H - 4} Z"/><path class="growth__line" d="${path}"/><circle class="growth__dot" cx="${W - 4}" cy="${H - 8 - (acc / mx) * (H - 16)}" r="2.5"/></svg>
    <span class="growth__axis"><em>${y0}</em><em>${Math.round((y0 + y1) / 2)}</em><em>${y1}</em></span>`);

  ui.innerHTML = [profile, dash, insights, recog, trend, reacts, collab, fb, follower, thumbs, msg, growth].join('');
  [...ui.children].forEach((el, i) => el.style.setProperty('--i', i));

  // sparkles
  const sparks = document.querySelector('.poster__sparks');
  if (sparks) sparks.innerHTML = Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53 + 7) % 100}%;--d:${(i * 0.37) % 4}s;--s:${.4 + ((i * 29) % 7) / 10}"></i>`).join('');

  // entrance + count-ups
  requestAnimationFrame(() => document.getElementById('poster').classList.add('is-in'));
  if (!reduced) ui.querySelectorAll('[data-count]').forEach((n, i) => {
    const to = +n.dataset.count, t0 = performance.now() + 500 + i * 150;
    (function tick(now) { const k = Math.min(1, Math.max(0, (now - t0) / 1000)); n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); })(t0);
  });
})();
