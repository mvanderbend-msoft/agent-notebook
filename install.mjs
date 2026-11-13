#!/usr/bin/env node
// Adds the agent notebook to a repository.
// Usage: node install.mjs [target-dir] [--instructions <file>] [--force]
import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--instructions');

if (flag('--help') || flag('-h')) {
  console.log(`Usage: agent-notebook [target-dir] [--instructions <file>] [--force]

Copies memory/, scripts/check-memory.mjs and the memory workflows into target-dir
(default: current directory) and adds a "Memory" section to your agent instructions.

  --instructions <file>  Instruction file to add the Memory section to, relative to
                         target-dir. Default: AGENTS.md if it exists, otherwise
                         .github/copilot-instructions.md if it exists, otherwise a new AGENTS.md.
  --force                Overwrite files that already exist.`);
  process.exit(0);
}

const templateDir = path.join(import.meta.dirname, 'template');
const target = path.resolve(positional[0] ?? '.');
const force = flag('--force');

if (!existsSync(target) || !statSync(target).isDirectory()) {
  console.error(`Target directory not found: ${target}`);
  process.exit(1);
}

const created = [];
const skipped = [];

function copyTree(relDir) {
  for (const entry of readdirSync(path.join(templateDir, relDir), { withFileTypes: true })) {
    const rel = path.join(relDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(rel);
      continue;
    }
    if (rel === 'instructions-snippet.md') continue;
    const dest = path.join(target, rel);
    if (existsSync(dest) && !force) {
      skipped.push(rel);
      continue;
    }
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(path.join(templateDir, rel), dest);
    created.push(rel);
  }
}

copyTree('');

const instructionsRel =
  option('--instructions') ??
  ['AGENTS.md', path.join('.github', 'copilot-instructions.md')].find((f) => existsSync(path.join(target, f))) ??
  'AGENTS.md';
const instructionsPath = path.join(target, instructionsRel);
const existing = existsSync(instructionsPath) ? readFileSync(instructionsPath, 'utf8') : '';
let instructionsResult;

if (existing.includes('memory/README.md')) {
  instructionsResult = `${instructionsRel} already mentions memory/README.md; left unchanged`;
} else {
  const linkToReadme = path
    .relative(path.dirname(instructionsPath), path.join(target, 'memory', 'README.md'))
    .split(path.sep)
    .join('/');
  const snippet = readFileSync(path.join(templateDir, 'instructions-snippet.md'), 'utf8').replace(
    '](memory/README.md)',
    `](${linkToReadme})`,
  );
  if (existing) {
    appendFileSync(instructionsPath, `${existing.endsWith('\n') ? '' : '\n'}\n${snippet}`);
    instructionsResult = `added a Memory section to ${instructionsRel}`;
  } else {
    mkdirSync(path.dirname(instructionsPath), { recursive: true });
    writeFileSync(instructionsPath, `# Agent instructions\n\n${snippet}`);
    instructionsResult = `created ${instructionsRel} with a Memory section`;
  }
}

const show = (p) => p.split(path.sep).join('/');
console.log(`Agent notebook added to ${target}\n`);
for (const f of created) console.log(`  created  ${show(f)}`);
for (const f of skipped) console.log(`  skipped  ${show(f)} (exists; use --force to overwrite)`);
console.log(`  ${instructionsResult}`);
console.log(`
Next steps:
  1. Run the checker:            node scripts/check-memory.mjs
  2. Compile the tidy workflow:  gh extension install github/gh-aw && gh aw compile memory-tidy
  3. Add a COPILOT_GITHUB_TOKEN repository secret for the tidy workflow
     (see https://github.github.com/gh-aw/reference/engines/#github-copilot-default)
  4. Commit and run one real task. Check whether the agent read the notebook,
     wrote something worth keeping, and skipped what it could look up.`);
