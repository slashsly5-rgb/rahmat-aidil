// site/tests/data.test.js — loads the real data files like a browser would and validates them.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { validate } = require('../js/lib.js');

const FILES = ['profile', 'career', 'projects', 'academic', 'credentials', 'training'];

function loadData() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  FILES.forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', `${f}.js`), 'utf8'), ctx, { filename: `${f}.js` }));
  return ctx.window.DATA;
}

test('all data files load and pass validation', () => {
  const DATA = loadData();
  assert.deepEqual(validate(DATA), []);
});

test('data has real content in every section', () => {
  const D = loadData();
  assert.ok(D.career.jobs.length >= 6, 'career jobs');
  assert.ok(D.projects.platforms.length >= 15, 'platforms');
  assert.ok(D.projects.tools.length >= 15, 'tools');
  assert.ok(D.academic.supervision.length >= 8, 'supervision');
  assert.ok(D.credentials.talks.length >= 8, 'talks');
  assert.ok(D.training.programmes.length >= 20, 'training programmes');
  assert.ok(D.training.programmes.every(p => p.topics.length), 'every programme has topics');
});

test('contact details match owner rule', () => {
  const { contact } = loadData().profile;
  assert.equal(contact.phone, '016-772 5496');
  assert.equal(contact.email, 'slydil@uts.edu.my');
});
