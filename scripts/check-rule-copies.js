#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8').replace(/\r\n/g, '\n').trim();
}

function stripFrontmatter(text) {
  return text.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();
}

const agents = read('AGENTS.md');
const canonical = agents.trim();

// Compact copies: same body as AGENTS.md, host-specific frontmatter stripped.
const copies = [
  ['.cursor/rules/hiding.mdc', stripFrontmatter],
  ['.windsurf/rules/hiding.md', text => text.trim()],
  ['.clinerules/hiding.md', text => text.trim()],
  ['.github/copilot-instructions.md', text => text.trim()],
  ['.kiro/steering/hiding.md', stripFrontmatter],
  ['.agents/rules/hiding.md', text => text.trim()],
];

let failed = false;

for (const [relPath, normalize] of copies) {
  const actual = normalize(read(relPath));
  if (actual !== canonical) {
    console.error(`${relPath} drifted from AGENTS.md`);
    failed = true;
  }
}

// SKILL.md is the runtime source of truth — verify load-bearing invariants
// are present in both SKILL.md and AGENTS.md
const INVARIANTS = [
  'read as if written by a human',
  'Code logic is NEVER changed',
  'only comments and prose are stripped',
  'do nothing, say nothing',
  'remove the whole block',
  'leakage patterns',
  'structural integrity',
];

const skill = read('skills/hiding/SKILL.md');
const sources = [['skills/hiding/SKILL.md', skill], ['AGENTS.md', agents]];
for (const phrase of INVARIANTS) {
  for (const [label, text] of sources) {
    if (!text.includes(phrase)) {
      console.error(`${label} is missing rule invariant: "${phrase}"`);
      failed = true;
    }
  }
}

if (failed) {
  console.error('Update the copied rule text, AGENTS.md, or SKILL.md so the shared rules match.');
  process.exit(1);
}

console.log(`Rule copies match AGENTS.md; ${INVARIANTS.length} rule invariants present in SKILL.md and AGENTS.md.`);
