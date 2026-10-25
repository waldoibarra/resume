import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const source = resolve(import.meta.dirname, '..');
const base = { basics: { name: 'Example Person', label: 'Engineer' }, meta: { lastModified: '2020-01-01T00:00:00.000Z' } };

function run(cwd, command, args, options = {}) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  return result;
}
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}
function save(cwd, resume) {
  writeFileSync(join(cwd, 'resume.json'), JSON.stringify(resume, null, 2) + '\n');
}
function state(cwd) {
  return [readFileSync(join(cwd, 'resume.json'), 'utf8'), git(cwd, 'show', ':resume.json'), git(cwd, 'status', '--porcelain=v1')];
}
function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'resume-hook-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, 'init', '-q');
  git(cwd, 'config', 'user.name', 'Test User');
  git(cwd, 'config', 'user.email', 'test@example.invalid');
  git(cwd, 'config', 'core.hooksPath', '.husky');
  mkdirSync(join(cwd, '.husky'));
  mkdirSync(join(cwd, 'scripts'));
  copyFileSync(join(source, '.husky/pre-commit'), join(cwd, '.husky/pre-commit'));
  copyFileSync(join(source, 'scripts/update-resume-date.ts'), join(cwd, 'scripts/update-resume-date.ts'));
  symlinkSync(join(source, 'node_modules'), join(cwd, 'node_modules'), 'dir');
  save(cwd, base);
  writeFileSync(join(cwd, '.gitignore'), 'node_modules\n');
  writeFileSync(join(cwd, 'README.md'), 'Fixture only\n');
  git(cwd, 'add', '.gitignore', '.husky/pre-commit', 'scripts/update-resume-date.ts', 'README.md', 'resume.json');
  // Initial commit exercises the real hook with an absent HEAD resume.
  assert.equal(run(cwd, 'git', ['commit', '-qm', 'Initial']).status, 0);
  return cwd;
}

test('semantic CV change dates the committed payload without extra commits or unrelated index mutation', t => {
  const cwd = fixture(t);
  const original = JSON.parse(git(cwd, 'show', 'HEAD:resume.json'));
  save(cwd, { ...original, basics: { ...original.basics, label: 'Developer' } });
  writeFileSync(join(cwd, 'README.md'), 'Unrelated staged content\n');
  git(cwd, 'add', 'resume.json', 'README.md');
  const before = git(cwd, 'show', ':README.md');
  assert.equal(run(cwd, 'git', ['commit', '-qm', 'CV update']).status, 0);
  const committed = JSON.parse(git(cwd, 'show', 'HEAD:resume.json'));
  assert.equal(committed.basics.label, 'Developer');
  assert.notEqual(committed.meta.lastModified, original.meta.lastModified);
  assert.equal(git(cwd, 'show', 'HEAD:README.md'), before);
  assert.equal(git(cwd, 'rev-list', '--count', 'HEAD'), '2');
  assert.equal(git(cwd, 'status', '--porcelain=v1'), '');
});

test('docs-only commit and timestamp-only stage leave date untouched', t => {
  const cwd = fixture(t);
  const original = git(cwd, 'show', 'HEAD:resume.json');
  writeFileSync(join(cwd, 'README.md'), 'Documentation change\n');
  git(cwd, 'add', 'README.md');
  assert.equal(run(cwd, 'git', ['commit', '-qm', 'Docs']).status, 0);
  assert.equal(git(cwd, 'show', 'HEAD:resume.json'), original);
  const changed = JSON.parse(original);
  changed.meta.lastModified = '2021-01-01T00:00:00.000Z';
  save(cwd, changed);
  git(cwd, 'add', 'resume.json');
  const before = state(cwd);
  assert.equal(run(cwd, join(cwd, '.husky/pre-commit'), []).status, 0);
  assert.deepEqual(state(cwd), before);
});

test('repeated invocation retains first timestamp after further staged edits', t => {
  const cwd = fixture(t);
  const original = JSON.parse(git(cwd, 'show', 'HEAD:resume.json'));
  save(cwd, { ...original, basics: { name: 'Another Example' } });
  git(cwd, 'add', 'resume.json');
  assert.equal(run(cwd, join(cwd, '.husky/pre-commit'), []).status, 0);
  const before = state(cwd);
  assert.equal(run(cwd, join(cwd, '.husky/pre-commit'), []).status, 0);
  assert.deepEqual(state(cwd), before);
  const stamped = JSON.parse(before[1]);
  save(cwd, { ...stamped, basics: { name: 'Final Example' } });
  git(cwd, 'add', 'resume.json');
  assert.equal(run(cwd, join(cwd, '.husky/pre-commit'), []).status, 0);
  assert.equal(JSON.parse(git(cwd, 'show', ':resume.json')).meta.lastModified, stamped.meta.lastModified);
});

test('reordering JSON object keys does not change the timestamp', t => {
  const cwd = fixture(t);
  const original = JSON.parse(git(cwd, 'show', 'HEAD:resume.json'));
  const reordered = { meta: original.meta, basics: { label: original.basics.label, name: original.basics.name } };
  save(cwd, reordered);
  git(cwd, 'add', 'resume.json');
  const before = state(cwd);
  assert.equal(run(cwd, join(cwd, '.husky/pre-commit'), []).status, 0);
  assert.deepEqual(state(cwd), before);
});

test('invalid staged CV is rejected even when working tree is valid', t => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'resume.json'), '{ invalid');
  git(cwd, 'add', 'resume.json');
  save(cwd, base);
  const before = state(cwd);
  const rejected = run(cwd, 'git', ['commit', '-qm', 'Bad staged resume']);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /Could not read resume: stdin/);
  assert.deepEqual(state(cwd), before);
  assert.equal(git(cwd, 'rev-list', '--count', 'HEAD'), '1');
});

test('schema validation failure leaves index and worktree unchanged', t => {
  const cwd = fixture(t);
  save(cwd, { basics: { name: 47 }, meta: { lastModified: base.meta.lastModified } });
  git(cwd, 'add', 'resume.json');
  const before = state(cwd);
  const rejected = run(cwd, join(cwd, '.husky/pre-commit'), []);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /string|schema/i);
  assert.deepEqual(state(cwd), before);
});

test('unresolved resume conflicts reject without changing index or worktree', t => {
  const cwd = fixture(t);
  const original = git(cwd, 'rev-parse', 'HEAD:resume.json');
  const alternate = { ...base, basics: { name: 'Conflict Example' } };
  save(cwd, alternate);
  const other = git(cwd, 'hash-object', '-w', 'resume.json');
  const entries = [1, 2, 3].map((stage, index) =>
    `100644 ${index === 2 ? other : original} ${stage}\tresume.json`).join('\n') + '\n';
  assert.equal(run(cwd, 'git', ['update-index', '--index-info'], { input: entries }).status, 0);
  const indexBefore = git(cwd, 'ls-files', '--stage', '--', 'resume.json');
  const worktreeBefore = readFileSync(join(cwd, 'resume.json'));
  assert.notEqual(run(cwd, join(cwd, '.husky/pre-commit'), []).status, 0);
  assert.equal(git(cwd, 'ls-files', '--stage', '--', 'resume.json'), indexBefore);
  assert.deepEqual(readFileSync(join(cwd, 'resume.json')), worktreeBefore);
});

test('partially staged CV changes reject before mutation and preserve unrelated entries', t => {
  const cwd = fixture(t);
  const first = { ...base, basics: { name: 'Staged Example' } };
  save(cwd, first);
  git(cwd, 'add', 'resume.json');
  save(cwd, { ...first, basics: { name: 'Unstaged Example' } });
  writeFileSync(join(cwd, 'README.md'), 'Staged note\n');
  git(cwd, 'add', 'README.md');
  const before = state(cwd);
  const rejected = run(cwd, join(cwd, '.husky/pre-commit'), []);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /Stage all resume.json changes/);
  assert.deepEqual(state(cwd), before);
});
