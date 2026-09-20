// site/tests/resume.test.js — data the digital resume relies on, plus the shared slug helper.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { slug } = require('../js/lib.js');

function loadProjects() {
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'projects.js'), 'utf8'), ctx, { filename: 'projects.js' });
  return ctx.window.DATA.projects;
}

test('slug is url-safe and stable', () => {
  assert.equal(slug('Sentinel — Beneficial-Ownership & Fraud Intelligence'), 'sentinel-beneficial-ownership-fraud-intelligence');
  assert.equal(slug('  MEITD / SEEP Intelligence System '), 'meitd-seep-intelligence-system');
});

test('featured-build auto-pick finds a deployed platform for each priority sector', () => {
  const { platforms } = loadProjects();
  ['Enterprise', 'HR', 'Legal', 'Government'].forEach(sec => assert.ok(platforms.some(p => p.status === 'Deployed' && p.sector === sec), sec));
});

test('platform slugs are unique (deep links must be unambiguous)', () => {
  const { platforms } = loadProjects();
  const slugs = platforms.map(p => slug(p.name));
  assert.equal(new Set(slugs).size, slugs.length);
});

test('every tool belongs to a group', () => {
  const { tools } = loadProjects();
  tools.forEach(t => assert.ok(t.group && t.group.trim(), `${t.name} has no group`));
  assert.ok(new Set(tools.map(t => t.group)).size >= 3);
});
