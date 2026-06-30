#!/usr/bin/env node
// Generate .openclaw/skills/ from skills/hiding/SKILL.md.
// The OpenClaw skill package is a copy with frontmatter adapted for ClawHub.
// Run after changing skills/hiding/SKILL.md; CI fails if the output is stale.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, 'skills', 'hiding', 'SKILL.md');
const dest = path.join(root, '.openclaw', 'skills', 'hiding', 'SKILL.md');

const skillContent = fs.readFileSync(source, 'utf8').replace(/\r\n/g, '\n');

// Extract frontmatter
const fmMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
if (!fmMatch) {
  console.error('Source SKILL.md missing frontmatter');
  process.exit(1);
}

const fm = fmMatch[1];
const body = skillContent.substring(fmMatch[0].length).trim();

// Parse name and description from source frontmatter
const nameMatch = fm.match(/^name:\s*(.+)$/m);
const descMatch = fm.match(/^description:\s*(.+)$/m);

const openclawFm = [
  '---',
  `name: ${nameMatch ? nameMatch[1].trim() : 'hiding'}`,
  `description: "${descMatch ? descMatch[1].trim().replace(/"/g, '\\"') : 'Strip AI leakage from files'}"`,
  'homepage: https://github.com/HuaTalk/hiding-skill',
  'license: MIT',
  '---',
].join('\n');

// Build simplified body for OpenClaw (without Claude Code-specific execution steps)
const openclawBody = body
  .replace(/\n## Session-Aware HITL[\s\S]*?(?=\n## |$)/, '')
  .replace(/\n### Mode Selection[\s\S]*?(?=\n### |\n## |$)/, '')
  .trim();

const output = openclawFm + '\n\n' + openclawBody + '\n';

if (fs.existsSync(dest)) {
  const current = fs.readFileSync(dest, 'utf8').replace(/\r\n/g, '\n');
  if (current === output) {
    console.log('.openclaw/skills/hiding/SKILL.md is up to date.');
    process.exit(0);
  }
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, output, 'utf8');
console.log('Generated .openclaw/skills/hiding/SKILL.md');
