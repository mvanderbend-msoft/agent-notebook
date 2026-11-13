#!/usr/bin/env node
// Validates memory/*.md notes: required fields, and that every `file:line` → `anchor`
// piece of evidence still points at code containing the anchor.
// Usage: node scripts/check-memory.mjs [--fix]   (--fix rewrites line numbers that only moved)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const memoryDir = path.join(root, 'memory');
const fix = process.argv.includes('--fix');
const STALE_AFTER_DAYS = 90;
const STATUSES = new Set(['confirmed', 'hypothesis']);
const FILE_EVIDENCE = /^`([^`]+?):(\d+)`\s*(?:→|->)\s*`(.+)`\s*$/;

const errors = [];
const warnings = [];
const counts = { notes: 0, confirmed: 0, hypothesis: 0, fixed: 0 };

function checkFileEvidence(where, file, line, anchor) {
  const abs = path.join(root, file);
  if (!existsSync(abs)) {
    errors.push(`${where}: evidence file not found: ${file}`);
    return null;
  }
  const lines = readFileSync(abs, 'utf8').split(/\r?\n/);
  if (lines[line - 1]?.includes(anchor)) return null;

  const matches = lines.flatMap((text, i) => (text.includes(anchor) ? [i + 1] : []));
  if (matches.length === 1) {
    if (!fix) warnings.push(`${where}: \`${anchor}\` moved from ${file}:${line} to ${file}:${matches[0]} (run memory:fix)`);
    return matches[0];
  }
  if (matches.length > 1) {
    errors.push(`${where}: \`${anchor}\` is no longer on ${file}:${line} and matches ${matches.length} lines; pick one`);
  } else {
    errors.push(`${where}: STALE - \`${anchor}\` no longer appears in ${file}; re-check or remove this note`);
  }
  return null;
}

const files = readdirSync(memoryDir).filter((f) => f.endsWith('.md') && f !== 'README.md');

for (const name of files) {
  const filePath = path.join(memoryDir, name);
  const original = readFileSync(filePath, 'utf8');
  let updated = original;
  const sections = original.split(/^## /m).slice(1);

  for (const section of sections) {
    const title = section.split(/\r?\n/, 1)[0].trim();
    const where = `memory/${name} › "${title}"`;
    const field = (label) =>
      [...section.matchAll(new RegExp(`^- \\*\\*${label}:\\*\\*\\s*(.+)$`, 'gm'))].map((m) => m[1].trim());
    counts.notes++;

    const [status] = field('Status');
    if (!status || !STATUSES.has(status)) {
      errors.push(`${where}: Status must be one of ${[...STATUSES].join(', ')} (got "${status ?? ''}")`);
    } else {
      counts[status]++;
      if (status === 'hypothesis') warnings.push(`${where}: hypothesis; test it before relying on it`);
    }

    const evidence = field('Evidence');
    if (evidence.length === 0) errors.push(`${where}: needs at least one Evidence line`);
    for (const ev of evidence) {
      const m = ev.match(FILE_EVIDENCE);
      if (!m) continue;
      const [, file, lineStr, anchor] = m;
      const movedTo = checkFileEvidence(where, file, Number(lineStr), anchor);
      if (movedTo && fix) {
        updated = updated.replace(`\`${file}:${lineStr}\``, `\`${file}:${movedTo}\``);
        counts.fixed++;
      }
    }

    const [checked] = field('Checked');
    const date = checked?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
    if (!date) {
      errors.push(`${where}: Checked must start with a YYYY-MM-DD date`);
    } else {
      const ageDays = (Date.now() - Date.parse(date)) / 86_400_000;
      if (ageDays > STALE_AFTER_DAYS) warnings.push(`${where}: last checked ${Math.floor(ageDays)} days ago`);
    }

    if (field('Why it matters').length === 0) errors.push(`${where}: missing "Why it matters"`);
  }

  if (updated !== original) writeFileSync(filePath, updated);
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(
  `\n${counts.notes} notes (${counts.confirmed} confirmed, ${counts.hypothesis} hypothesis)` +
    (fix ? `, ${counts.fixed} line number(s) fixed` : '') +
    `, ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length ? 1 : 0);
