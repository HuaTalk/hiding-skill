#!/usr/bin/env node
// Version-consistency guard. Hiding declares its version in multiple files
// across different host ecosystems. Every release must bump all of them.
//
// This check ensures:
//   1. every version-bearing file shares one pinned X.Y.Z version
//   2. on a release-tag CI run, that shared version equals the tag

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const PINNED_SEMVER = /^\d+\.\d+\.\d+$/;

const VERSION_FILES = [
  '.claude-plugin/plugin.json',   // Claude Code plugin
  'package.json',                 // npm / repo root
];

function readVersion(relPath) {
  try {
    const raw = fs.readFileSync(path.join(root, relPath), 'utf8').replace(/^﻿/, '');
    return JSON.parse(raw).version;
  } catch (e) {
    throw new Error(`${relPath}: ${e.message}`);
  }
}

let failed = false;
const versions = [];

for (const relPath of VERSION_FILES) {
  let version;
  try {
    version = readVersion(relPath);
  } catch (e) {
    console.error(e.message);
    failed = true;
    continue;
  }
  if (typeof version !== 'string' || !PINNED_SEMVER.test(version)) {
    console.error(`${relPath}: version must be a pinned X.Y.Z semver, got ${JSON.stringify(version)}`);
    failed = true;
  }
  versions.push([relPath, version]);
}

// SKILL.md metadata version
try {
  const skillRaw = fs.readFileSync(path.join(root, 'skills/hiding/SKILL.md'), 'utf8');
  const skillMatch = skillRaw.match(/version:\s*"([^"]+)"/);
  if (skillMatch) {
    versions.push(['skills/hiding/SKILL.md', skillMatch[1]]);
    if (!PINNED_SEMVER.test(skillMatch[1])) {
      console.error(`skills/hiding/SKILL.md: version must be a pinned X.Y.Z semver, got ${JSON.stringify(skillMatch[1])}`);
      failed = true;
    }
  }
} catch (e) {
  console.error(`skills/hiding/SKILL.md: ${e.message}`);
  failed = true;
}

// Every file must declare the same version
const distinct = [...new Set(versions.map(([, v]) => v))];
if (distinct.length > 1) {
  console.error('Version mismatch — every manifest must share one version:');
  for (const [relPath, version] of versions) console.error(`  ${version}\t${relPath}`);
  failed = true;
}
const shared = distinct.length === 1 ? distinct[0] : null;

// On release-tag push, version must match tag
if (shared && process.env.GITHUB_REF_TYPE === 'tag') {
  const tag = process.env.GITHUB_REF_NAME || '';
  const tagVersion = tag.replace(/^v/, '');
  if (PINNED_SEMVER.test(tagVersion) && tagVersion !== shared) {
    console.error(`release tag ${tag} does not match version ${shared}; bump the version files before tagging`);
    failed = true;
  }
}

if (failed) {
  console.error('Align the version fields so every manifest shares one version.');
  process.exit(1);
}

console.log(`All ${versions.length} version files pinned at ${shared}.`);
