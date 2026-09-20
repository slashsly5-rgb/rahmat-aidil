const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/lib.js');

const TODAY = new Date(2026, 8, 19); // 19 Sep 2026

test('esc escapes html and blanks nullish', () => {
  assert.equal(L.esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  assert.equal(L.esc(undefined), '');
  assert.equal(L.esc(null), '');
  assert.equal(L.esc(5), '5');
});

test('parseDate handles year, month, day precision', () => {
  assert.equal(L.parseDate('2025').getFullYear(), 2025);
  assert.equal(L.parseDate('2025-04').getMonth(), 3);
  assert.equal(L.parseDate('2026-10-21').getDate(), 21);
  assert.equal(L.parseDate('Apr 2025'), null);
  assert.equal(L.parseDate(undefined), null);
});

test('isPast compares against start of today', () => {
  assert.equal(L.isPast('2026-09-18', TODAY), true);
  assert.equal(L.isPast('2026-09-19', TODAY), false);
  assert.equal(L.isPast('2026-10-21', TODAY), false);
  assert.equal(L.isPast('bad', TODAY), false);
});

test('splitByDate splits and sorts', () => {
  const items = [{ date: '2024-09' }, { date: '2026-10-21' }, { date: '2025-04' }, { date: '2026-12-01' }];
  const { upcoming, past } = L.splitByDate(items, TODAY);
  assert.deepEqual(upcoming.map(i => i.date), ['2026-10-21', '2026-12-01']);
  assert.deepEqual(past.map(i => i.date), ['2025-04', '2024-09']);
});

test('splitByDate puts undated items in past, after dated ones', () => {
  const items = [{ t: 'u' }, { date: '2024-09' }, { date: '2026-10-21' }, { t: 'v', date: '' }];
  const { upcoming, past } = L.splitByDate(items, TODAY);
  assert.deepEqual(upcoming.map(i => i.date), ['2026-10-21']);
  assert.deepEqual(past.map(i => i.date || i.t), ['2024-09', 'u', 'v']);
});

test('validate accepts talks without a date but rejects a malformed one', () => {
  const d = validData();
  d.credentials.talks.push({ title: 'Undated workshop' });
  assert.deepEqual(L.validate(d), []);
});

test('validate: supervision needs level, status and role; thesis title is optional', () => {
  const d = validData();
  d.academic.supervision.push({ level: 'PhD', status: 'Ongoing', role: 'Main supervisor' });
  assert.deepEqual(L.validate(d), []);
  d.academic.supervision.push({ level: 'PhD', status: 'Ongoing' });
  assert.ok(L.validate(d).some(e => e.includes('academic.supervision[2]') && e.includes('role')));
});

test('activeNow keeps items without until or with future until', () => {
  const items = [{ t: 'a', until: '2026-10-21' }, { t: 'b', until: '2026-01-01' }, { t: 'c' }];
  assert.deepEqual(L.activeNow(items, TODAY).map(i => i.t), ['a', 'c']);
});

test('uniqueValues flattens arrays and sorts', () => {
  const items = [{ tech: ['RAG', 'Agents'] }, { tech: 'RAG' }, { tech: ['Voice'] }, {}];
  assert.deepEqual(L.uniqueValues(items, 'tech'), ['Agents', 'RAG', 'Voice']);
});

test('matchesFilters treats null as any and supports arrays', () => {
  const item = { sector: 'Government', tech: ['RAG', 'Graph'] };
  assert.equal(L.matchesFilters(item, { sector: null, tech: null }), true);
  assert.equal(L.matchesFilters(item, { sector: 'Government', tech: 'Graph' }), true);
  assert.equal(L.matchesFilters(item, { sector: 'Energy' }), false);
});

test('countBy counts and sorts by key', () => {
  const items = [{ year: 2024 }, { year: 2022 }, { year: 2024 }];
  assert.deepEqual(L.countBy(items, 'year'), [[2022, 1], [2024, 2]]);
});

test('resolveStat counts data paths or passes through', () => {
  const DATA = { projects: { platforms: [1, 2, 3] } };
  assert.equal(L.resolveStat({ value: 'count:projects.platforms' }, DATA), 3);
  assert.equal(L.resolveStat({ value: 'count:missing.path' }, DATA), 0);
  assert.equal(L.resolveStat({ value: 20 }, DATA), 20);
});

test('validate accepts minimal valid data', () => {
  assert.deepEqual(L.validate(validData()), []);
});

test('validate reports missing required fields', () => {
  const d = validData();
  delete d.projects.platforms[0].summary;
  d.credentials.talks[0].date = 'someday';
  const errors = L.validate(d);
  assert.ok(errors.some(e => e.includes('projects.platforms[0]') && e.includes('summary')));
  assert.ok(errors.some(e => e.includes('credentials.talks[0]') && e.includes('date')));
});

test('validate rejects forbidden private keys anywhere', () => {
  const d = validData();
  d.academic.supervision[0].studentName = 'X';
  d.profile.ic = '123';
  const errors = L.validate(d);
  assert.ok(errors.some(e => e.includes('studentName')));
  assert.ok(errors.some(e => e.includes('ic')));
});

function validData() {
  return {
    profile: { name: 'N', headline: 'H', roles: ['R'], verbs: ['V'], stats: [{ label: 'L', value: 1 }], now: [], contact: { email: 'e', phone: 'p' } },
    career: { jobs: [{ title: 'T', org: 'O', start: '2016' }], sideRoles: [], education: [] },
    projects: { platforms: [{ name: 'P', summary: 'S', sector: 'Gov' }], tools: [{ name: 'T', summary: 'S' }] },
    academic: { areas: [{ id: 'a', label: 'A' }], supervision: [{ title: 'T', level: 'PhD', status: 'Ongoing', role: 'Main supervisor' }], publications: [{ title: 'T', year: 2024, type: 'Journal' }] },
    credentials: { credentials: [{ title: 'C', issuer: 'I' }], talks: [{ title: 'T', date: '2025-04' }] },
  };
}
