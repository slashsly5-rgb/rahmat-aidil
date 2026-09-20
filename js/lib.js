// site/js/lib.js — pure helpers, shared by browser (window.LIB) and Node tests.
(function (root) {
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = v => (v == null ? '' : String(v).replace(/[&<>"']/g, c => ESC[c]));

  function parseDate(s) {
    const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(String(s ?? ''));
    if (!m) return null;
    return new Date(+m[1], m[2] ? +m[2] - 1 : 0, m[3] ? +m[3] : 1);
  }

  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

  function isPast(s, today = new Date()) {
    const d = parseDate(s);
    return !!d && d < startOfDay(today);
  }

  // Undated items count as past and sort after every dated one (original order kept among them).
  function splitByDate(items, today = new Date()) {
    const t = i => parseDate(i.date)?.getTime() ?? -Infinity;
    const dated = items.filter(i => parseDate(i.date));
    return {
      upcoming: dated.filter(i => !isPast(i.date, today)).sort((a, b) => t(a) - t(b)),
      past: [...dated.filter(i => isPast(i.date, today)).sort((a, b) => t(b) - t(a)), ...items.filter(i => !parseDate(i.date))],
    };
  }

  const activeNow = (items, today = new Date()) => items.filter(i => !i.until || !isPast(i.until, today));

  const asList = v => (v == null ? [] : Array.isArray(v) ? v : [v]);

  const uniqueValues = (items, key) =>
    [...new Set(items.flatMap(i => asList(i[key])))].sort((a, b) => String(a).localeCompare(String(b)));

  const matchesFilters = (item, filters) =>
    Object.entries(filters).every(([k, v]) => v == null || asList(item[k]).includes(v));

  function countBy(items, key) {
    const m = new Map();
    items.forEach(i => { if (i[key] != null) m.set(i[key], (m.get(i[key]) || 0) + 1); });
    return [...m.entries()].sort((a, b) => (a[0] > b[0] ? 1 : -1));
  }

  function resolveStat(stat, DATA) {
    if (typeof stat.value !== 'string' || !stat.value.startsWith('count:')) return stat.value;
    const v = stat.value.slice(6).split('.').reduce((o, k) => (o == null ? o : o[k]), DATA);
    return Array.isArray(v) ? v.length : 0;
  }

  // Schema: section -> list path -> required fields. Keep in sync with data/*.js.
  const SCHEMA = {
    'career.jobs': ['title', 'org', 'start'],
    'career.sideRoles': ['title', 'org'],
    'career.education': ['qualification', 'institution'],
    'projects.platforms': ['name', 'summary', 'sector'],
    'projects.tools': ['name', 'summary'],
    'academic.areas': ['id', 'label'],
    'academic.supervision': ['level', 'status', 'role'], // title optional: new candidates may not have one registered yet
    'academic.publications': ['title', 'year', 'type'],
    'credentials.credentials': ['title', 'issuer'],
    'credentials.talks': ['title'], // date optional: undated CV entries are listed as past
  };
  const DATE_FIELDS = ['date', 'until', 'start', 'end'];
  const FORBIDDEN = ['ic', 'nric', 'gender', 'address', 'homeAddress', 'studentName', 'student'];

  function validate(DATA) {
    const errors = [];
    const p = DATA.profile;
    if (!p) errors.push('profile missing');
    else ['name', 'headline'].forEach(f => { if (!p[f]) errors.push(`profile: missing ${f}`); });

    Object.entries(SCHEMA).forEach(([path, fields]) => {
      const list = path.split('.').reduce((o, k) => (o == null ? o : o[k]), DATA);
      if (!Array.isArray(list)) { errors.push(`${path}: not an array`); return; }
      list.forEach((item, i) => {
        fields.forEach(f => { if (item[f] == null || item[f] === '') errors.push(`${path}[${i}]: missing ${f}`); });
        DATE_FIELDS.forEach(f => {
          if (item[f] != null && item[f] !== 'Present' && !parseDate(item[f])) errors.push(`${path}[${i}]: bad ${f} "${item[f]}"`);
        });
      });
    });

    (function walk(node, trail) {
      if (node && typeof node === 'object') {
        Object.keys(node).forEach(k => {
          if (!Array.isArray(node) && FORBIDDEN.includes(k)) errors.push(`${trail}.${k}: private field not allowed`);
          walk(node[k], `${trail}.${k}`);
        });
      }
    })(DATA, 'DATA');
    return errors;
  }

  const LIB = { esc, parseDate, isPast, splitByDate, activeNow, uniqueValues, matchesFilters, countBy, resolveStat, validate };
  if (typeof module !== 'undefined' && module.exports) module.exports = LIB;
  else root.LIB = LIB;
})(typeof window !== 'undefined' ? window : globalThis);
