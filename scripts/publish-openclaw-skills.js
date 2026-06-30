#!/usr/bin/env node
// Publish hiding skill to ClawHub.
// Run after changing skills/hiding/SKILL.md and running build-openclaw-skills.js.
// Requires: clawhub login (run once)

const { execSync } = require('child_process');

const dryRun = process.argv.includes('--dry-run');
const args = dryRun ? '--dry-run' : '';

try {
  execSync(`clawhub publish ${args} .openclaw/skills/hiding`, {
    stdio: 'inherit',
    cwd: require('path').join(__dirname, '..'),
  });
  console.log(dryRun ? '[DRY RUN] Would publish hiding to ClawHub' : 'Published hiding to ClawHub');
} catch (e) {
  console.error('Failed to publish to ClawHub. Run `clawhub login` first.');
  process.exit(1);
}
