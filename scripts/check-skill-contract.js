#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const skillDir = path.join(root, 'skills', 'hiding');
const skillPath = path.join(skillDir, 'SKILL.md');
const referencesDir = path.join(skillDir, 'references');
const expectedDescriptionSha256 = '343fa0d3a526db0b36d296b57a73683e93089e7918a27bf8222ffa578c901972';
const expectedArgumentHint = '[<what-to-hide>...] [--files <file>...|session|worktree] [options]';

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
}

function walkMarkdown(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(entryPath));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(entryPath);
  }
  return files.sort();
}

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(?:"([^"]*)"|'([^']*)'|(.*))$`, 'm'));
  return match ? (match[1] ?? match[2] ?? match[3]).trim() : null;
}

const skill = read(skillPath);
const frontmatterMatch = skill.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);

if (!frontmatterMatch) {
  fail('SKILL.md frontmatter is missing or malformed.');
} else {
  const frontmatter = frontmatterMatch[1];
  if (frontmatterValue(frontmatter, 'name') !== 'hiding') {
    fail('SKILL.md name must remain hiding.');
  }
  const description = frontmatterValue(frontmatter, 'description') || '';
  const descriptionSha256 = crypto.createHash('sha256').update(description).digest('hex');
  if (descriptionSha256 !== expectedDescriptionSha256) {
    fail('SKILL.md description changed.');
  }
  if (frontmatterValue(frontmatter, 'argument-hint') !== expectedArgumentHint) {
    fail('SKILL.md argument-hint changed.');
  }
  if (!/^metadata:\s*\n(?: {2}[^\n]+\n)* {2}version:\s*["']?[^"'\s]+["']?\s*$/m.test(frontmatter)) {
    fail('SKILL.md metadata.version is missing or malformed.');
  }
}

const skillLines = skill.split('\n').length;
if (skillLines > 500) fail(`SKILL.md exceeds the 500-line Agent Skills guideline (${skillLines}).`);

const localLinkPattern = /\[[^\]]+\]\(([^)]+\.md(?:#[^)]+)?)\)/g;
const linkedReferences = new Set();
let match;

while ((match = localLinkPattern.exec(skill)) !== null) {
  const link = match[1].split('#')[0];
  if (/^[a-z]+:\/\//i.test(link)) continue;
  const normalized = path.posix.normalize(link);
  if (!/^references\/[^/]+\.md$/.test(normalized)) {
    fail(`SKILL.md reference must be one level deep under references/: ${link}`);
    continue;
  }
  const resolved = path.resolve(skillDir, normalized);
  if (!resolved.startsWith(`${referencesDir}${path.sep}`) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    fail(`SKILL.md reference is missing or unreadable: ${link}`);
    continue;
  }
  linkedReferences.add(resolved);
}

const referenceFiles = walkMarkdown(referencesDir);
for (const referencePath of referenceFiles) {
  if (!linkedReferences.has(referencePath)) {
    fail(`Reference is not linked directly from SKILL.md: ${path.relative(skillDir, referencePath)}`);
  }
  const content = read(referencePath);
  localLinkPattern.lastIndex = 0;
  while ((match = localLinkPattern.exec(content)) !== null) {
    if (!/^[a-z]+:\/\//i.test(match[1])) {
      fail(`Reference-to-reference Markdown links are not allowed: ${path.relative(skillDir, referencePath)} -> ${match[1]}`);
    }
  }
}

const automaticScope = read(path.join(referencesDir, 'automatic-scope.md'));
if (!/when `--files` is omitted or set to `session` or `worktree`/.test(automaticScope)) {
  fail('Automatic-scope reference must include the default invocation condition.');
}

const requiredEntryRoutes = [
  ['automatic eligibility before content access', /Omitted `--files`, `--files session`, or `--files worktree`[^\n]+\(references\/automatic-scope\.md\) before validation or content access/],
  ['default session workflow', /Omitted `--files` or `--files session`[^\n]+\(references\/session-mode\.md\)/],
  ['worktree workflow', /`--files worktree`[^\n]+\(references\/worktree-mode\.md\)/],
  ['category rubric after scope and validation', /After literal selection or automatic scope chooses a file and Step 0 validates it, read \[Leakage categories\]\(references\/leakage-categories\.md\) before leakage scanning/],
  ['semantic-target rules', /One or more semantic targets[^\n]+\(references\/user-targets\.md\)/],
  ['optional output behavior', /`--dry-run` or a non-default output mode[^\n]+\(references\/output-modes\.md\)/],
  ['sub-agent workflow', /`--use-subagent`[^\n]+\(references\/subagent-review\.md\)/],
  ['reporting before visible output', /Before any user-visible output[^\n]+\(references\/reporting\.md\)/],
];

for (const [label, pattern] of requiredEntryRoutes) {
  if (!pattern.test(skill)) fail(`Conditional reference route is missing: ${label}.`);
}

if (skill.indexOf('(references/automatic-scope.md)') > skill.indexOf('(references/leakage-categories.md)')) {
  fail('Automatic-scope route must precede the scan-only category route.');
}

const corpus = [skill, ...referenceFiles.map(read)].join('\n');
const requiredInlineContracts = [
  ['silent no-findings behavior', /with no findings outside Session HITL or `--dry-run`, do nothing and say nothing/],
  ['default inplace behavior', /default `inplace` mode replaces the original only after successful validation/],
  ['line endings before writes', /Before any write, preserve the file's original line ending style/],
  ['concurrent modification before writes', /compare mtime with the value observed when reading; if it changed, warn and abort/],
  ['whole-block removal', /Remove a multi-line leakage block as a whole/],
];

for (const [label, pattern] of requiredInlineContracts) {
  if (!pattern.test(skill)) fail(`Always-loaded contract is missing from SKILL.md: ${label}.`);
}

const requiredContracts = [
  ['automatic scope before scanning', /Resolve scope before Step 0 or any content scan/],
  ['session inventory is not expanded by Git', /Git status may provide context but must not expand this inventory/],
  ['worktree selection is local-only', /Use local Git state only; do not fetch/],
  ['credential scan precedes purge', /Before any purge decision, scan every line, key, and value for credentials/],
  ['credential warning recommends rotation', /rotate the affected credentials immediately/],
  ['purge candidates are not partially stripped', /Do not strip a purge candidate/],
  ['whole-file deletion requires confirmation', /delete only on explicit confirmation/],
  ['dry-run never writes', /`--dry-run` never writes/],
  ['subagents detect candidates only', /sub-agent detects candidate leakage only/],
  ['runtime-visible code content is protected', /runtime-visible doc strings as-is/],
];

for (const [label, pattern] of requiredContracts) {
  if (!pattern.test(corpus)) fail(`Required contract is missing: ${label}.`);
}

const staleFlags = [
  ['--subagent', /(^|[^-])--subagent\b/m],
  ['--artifacts', /(^|[^-])--artifacts\b/m],
  ['--to-hide', /(^|[^-])--to-hide\b/m],
];

for (const [flag, pattern] of staleFlags) {
  if (pattern.test(corpus)) fail(`Stale flag found in the installed skill: ${flag}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log(`Hiding skill contract and ${referenceFiles.length} reference file(s): valid.`);
