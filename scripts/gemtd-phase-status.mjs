#!/usr/bin/env node
/**
 * Prints the next pending GemTD parity phase from docs/GEMTD-PARITY-CHECKLIST.md
 * Run: pnpm gemtd:next-phase
 */
import fs from 'node:fs';
import path from 'node:path';

const CHECKLIST = path.resolve(import.meta.dirname, '../docs/GEMTD-PARITY-CHECKLIST.md');

const text = fs.readFileSync(CHECKLIST, 'utf8');
const phaseRe = /^## Phase (\d+) — (.+)$/gm;
const statusRe = /^\*\*Status:\*\* `(\w+)`/m;

let match;
const phases = [];

while ((match = phaseRe.exec(text)) !== null) {
  const start = match.index;
  const nextHeading = text.indexOf('\n## Phase ', start + 1);
  const block = nextHeading === -1 ? text.slice(start) : text.slice(start, nextHeading);
  const statusMatch = block.match(statusRe);
  const status = statusMatch?.[1] ?? 'pending';
  phases.push({
    number: Number(match[1]),
    title: match[2].trim(),
    status,
  });
}

const next = phases.find((p) => p.status === 'pending' || p.status === 'in_progress');

if (!next) {
  console.log('ALL_DONE');
  console.log('All GemTD parity phases are marked done in docs/GEMTD-PARITY-CHECKLIST.md');
  process.exit(0);
}

console.log(`NEXT_PHASE=${next.number}`);
console.log(`TITLE=${next.title}`);
console.log(`STATUS=${next.status}`);
console.log('');
console.log(`→ Implement Phase ${next.number}: ${next.title}`);
console.log('→ Follow docs/GEMTD-PHASE-LOOP.md');
console.log(`→ Update docs/GEMTD-PARITY-CHECKLIST.md when complete`);
