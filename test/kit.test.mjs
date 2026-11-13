import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const kit = path.resolve(import.meta.dirname, '..');
const today = new Date().toISOString().slice(0, 10);

function repoWithNote(evidence, code) {
  const dir = mkdtempSync(path.join(tmpdir(), 'notebook-'));
  cpSync(path.join(kit, 'template', 'scripts'), path.join(dir, 'scripts'), { recursive: true });
  mkdirSync(path.join(dir, 'memory'));
  mkdirSync(path.join(dir, 'src'));
  writeFileSync(path.join(dir, 'src', 'app.js'), code);
  writeFileSync(
    path.join(dir, 'memory', 'traps.md'),
    `# Traps\n\n## Options live in the products table\n\n- **Status:** confirmed\n- **Evidence:** ${evidence}\n- **Checked:** ${today}, read the code\n- **Why it matters:** filter them out.\n`,
  );
  return dir;
}

const check = (dir, ...args) =>
  spawnSync(process.execPath, [path.join(dir, 'scripts', 'check-memory.mjs'), ...args], { encoding: 'utf8' });

test('checker passes when evidence matches the cited line', () => {
  const dir = repoWithNote('`src/app.js:2` → `category = option`', 'a\ncategory = option\n');
  const r = check(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('checker fails when the anchor is gone', () => {
  const dir = repoWithNote('`src/app.js:2` → `category = option`', 'a\nb\n');
  const r = check(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /STALE/);
});

test('checker --fix updates a line number that only moved', () => {
  const dir = repoWithNote('`src/app.js:1` → `category = option`', 'a\nb\ncategory = option\n');
  assert.equal(check(dir, '--fix').status, 0);
  assert.match(readFileSync(path.join(dir, 'memory', 'traps.md'), 'utf8'), /`src\/app\.js:3`/);
});

const install = (dir, ...args) =>
  spawnSync(process.execPath, [path.join(kit, 'install.mjs'), dir, ...args], { encoding: 'utf8' });

test('installer links the Memory section relative to an existing copilot-instructions.md, once', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'target-'));
  mkdirSync(path.join(dir, '.github'));
  const instructions = path.join(dir, '.github', 'copilot-instructions.md');
  writeFileSync(instructions, '# My repo\n');

  assert.equal(install(dir).status, 0);
  assert.equal(install(dir).status, 0);

  const text = readFileSync(instructions, 'utf8');
  assert.equal(text.match(/## Memory/g).length, 1);
  assert.match(text, /\]\(\.\.\/memory\/README\.md\)/);
  assert.ok(!existsSync(path.join(dir, 'AGENTS.md')));
  for (const f of ['memory/README.md', 'scripts/check-memory.mjs', '.github/workflows/memory-tidy.md']) {
    assert.ok(existsSync(path.join(dir, f)), f);
  }
  assert.equal(check(dir).status, 0, 'fresh notebook passes the checker');
});

test('installer does not overwrite existing notes without --force', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'target-'));
  mkdirSync(path.join(dir, 'memory'));
  writeFileSync(path.join(dir, 'memory', 'traps.md'), 'mine');
  const r = install(dir);
  assert.match(r.stdout, /skipped\s+memory\/traps\.md/);
  assert.equal(readFileSync(path.join(dir, 'memory', 'traps.md'), 'utf8'), 'mine');
});
